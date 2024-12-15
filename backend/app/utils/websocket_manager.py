# websocket_manager.py

import json
import asyncio
from app.utils.shared import connections
from app.models import db
from datetime import datetime
import threading
import logging

# 로깅 설정
logging.basicConfig(
    filename="game.log",
    level=logging.INFO,
    format="%(asctime)s:%(levelname)s:%(message)s",
)


def log_event(message: str):
    with log_lock:
        logging.info(message)


log_lock = threading.Lock()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 플레이어 상태 저장을 위한 딕셔너리
player_states = {
    # room_id: {
    #     player_id: {'nickname': str, 'finished_at': datetime or None, 'pending_garbage': int}
    # }
}

game_loops = {}


async def game_loop(room_id: str):
    try:
        while True:
            # 게임 상태 업데이트 로직
            # 예: send game_state messages
            await asyncio.sleep(0.5)
    except asyncio.CancelledError:
        logger.info(f"{room_id} 방의 게임 루프가 중지되었습니다.")


# When a room is created
def create_room(room_id: str):
    # 기타 방 생성 로직...
    loop = asyncio.create_task(game_loop(room_id))
    game_loops[room_id] = loop


def broadcast(room_id: str, message: dict, exclude_player_id: str = None):
    if room_id not in connections:
        return

    closed_connections = []
    for pid, info in connections[room_id].items():
        if pid == exclude_player_id:
            continue
        try:
            asyncio.create_task(info["socket"].send_text(json.dumps(message)))
        except Exception as e:
            logger.warning(f"{pid}에게 메시지 전송 실패: {e}")
            closed_connections.append(pid)

    for pid in closed_connections:
        handle_disconnection(room_id, pid)

    # 메시지 전송 로그 최소화
    logger.info(f"{room_id} 방에 메시지 전송됨: {message}")
    log_event(f"Broadcast to {room_id}: {message}")


def handle_disconnection(room_id: str, player_id: str):
    if room_id not in connections or player_id not in connections[room_id]:
        return

    disconnected_info = connections[room_id].pop(player_id, None)
    if not disconnected_info:
        return

    room = db.rooms.find_one({"room_id": room_id})
    if not room:
        logger.info(f"{room_id} 방 정보가 없습니다.")
        return

    # 플레이어 상태 제거
    if room_id in player_states and player_id in player_states[room_id]:
        player_states[room_id].pop(player_id)

    if connections[room_id]:
        # 방장이 나간 경우 새 방장 지정
        if disconnected_info["nickname"] == room["host"]:
            assign_new_host(room_id)

        # 현재 방의 닉네임 목록
        player_nicknames = [info["nickname"] for info in connections[room_id].values()]
        current_host = db.rooms.find_one({"room_id": room_id})["host"]
        broadcast_info = {
            "type": "update_players",
            "players": player_nicknames,
            "host": current_host,
        }
        broadcast(room_id, broadcast_info)
        logger.info(
            f"{disconnected_info['nickname']}({player_id})가 방({room_id})을 떠났습니다. 현재 방장: {current_host}"
        )
        logger.info(
            f"현재 방({room_id}) 플레이어들: {player_nicknames}, 방장: {current_host}"
        )
    else:
        # 방에 아무도 없으면 방 삭제
        connections.pop(room_id, None)
        db.rooms.delete_one({"room_id": room_id})
        logger.info(f"{room_id} 방이 삭제되었습니다.")


def assign_new_host(room_id: str):
    if room_id not in connections or not connections[room_id]:
        logger.warning(f"{room_id} 방에 새 방장을 지정할 플레이어가 없습니다.")
        return

    new_host_id, new_host_info = next(iter(connections[room_id].items()))
    new_host_nickname = new_host_info["nickname"]
    db.rooms.update_one({"room_id": room_id}, {"$set": {"host": new_host_nickname}})

    # 호스트 변경 시에도 update_players로 반영
    player_nicknames = [info["nickname"] for info in connections[room_id].values()]
    broadcast(
        room_id,
        {
            "type": "update_players",
            "players": player_nicknames,
            "host": new_host_nickname,
        },
    )
    logger.info(f"{room_id} 방의 새로운 방장은 {new_host_nickname}입니다.")


def handle_game_over(room_id: str, player_id: str):
    if room_id not in player_states:
        player_states[room_id] = {}

    nickname = connections[room_id][player_id]["nickname"]
    player_states[room_id][player_id] = {
        "nickname": nickname,
        "finished_at": datetime.utcnow(),
    }

    # Check if all active players have finished
    active_players = connections.get(room_id, {})
    all_finished = True
    for pid in active_players:
        if (
            pid not in player_states[room_id]
            or player_states[room_id][pid]["finished_at"] is None
        ):
            all_finished = False
            break

    if all_finished:
        # Calculate rankings
        finished_players = list(player_states[room_id].values())
        # 가장 늦게 끝낸 사람이 1등
        finished_players.sort(key=lambda x: x["finished_at"], reverse=True)
        rankings = [
            {"rank": idx + 1, "nickname": player["nickname"]}
            for idx, player in enumerate(finished_players)
        ]

        # Broadcast rankings to all players in the room
        broadcast(room_id, {"type": "game_end", "rankings": rankings})
        logger.info(
            f"{room_id} 방에 대한 게임 종료 통계가 브로드캐스트되었습니다: {rankings}"
        )

        # Reset player states for the room
        player_states.pop(room_id, None)

        # Update 'game_started' to False
        db.rooms.update_one({"room_id": room_id}, {"$set": {"game_started": False}})
        logger.info(f"{room_id} 방의 'game_started' 필드가 False로 업데이트되었습니다.")

        # Optionally, stop the game loop for the room if running
        if room_id in game_loops:
            game_loops[room_id].cancel()
            game_loops.pop(room_id, None)


async def handle_websocket_message(room_id: str, player_id: str, message: dict):
    room = db.rooms.find_one({"room_id": room_id})
    player_nickname = connections[room_id][player_id]["nickname"]

    if message["type"] == "start_request":
        # player_id가 host인지 확인
        if room and player_nickname == room["host"]:
            # 모든 클라이언트에게 start 메시지 브로드캐스트
            broadcast(
                room_id, {"type": "start", "title": room["title"], "host": room["host"]}
            )
            logger.info(f"{room['title']} 방장({room['host']})가 게임을 시작했습니다.")
        else:
            # 호스트가 아니면 무시
            logger.warning(
                f"{player_nickname}이(가) 게임 시작을 시도했으나 방장이 아닙니다."
            )
    elif message["type"] == "game_state":
        # 클라이언트의 게임 상태 수신 -> 다른 클라이언트에게 브로드캐스트
        if "state" in message:
            broadcast(
                room_id,
                {
                    "type": "game_state",
                    "player_id": player_nickname,
                    "state": message["state"],
                },
                exclude_player_id=player_id,
            )
        else:
            logger.warning(f"{player_id}의 게임 상태가 없음")
    elif message["type"] == "chat":
        # 채팅 메시지 전달
        broadcast(
            room_id,
            {"type": "chat", "sender": player_nickname, "message": message["message"]},
        )
    elif message["type"] == "clear_lines":
        cleared_lines = message.get("count", 0)
        if cleared_lines <= 0:
            return

        # Initialize player_states for the room if not present
        if room_id not in player_states:
            player_states[room_id] = {}
        if player_id not in player_states[room_id]:
            player_states[room_id][player_id] = {
                "nickname": player_nickname,
                "finished_at": None,
                "pending_garbage": 0,
            }

        # Directly set garbage_to_send based on cleared_lines
        garbage_to_send = cleared_lines

        # Broadcast garbage to other players
        if garbage_to_send > 0:
            for pid, info in connections[room_id].items():
                if pid != player_id:
                    # Initialize player_state for the recipient if not present
                    if pid not in player_states[room_id]:
                        player_states[room_id][pid] = {
                            "nickname": info["nickname"],
                            "finished_at": None,
                            "pending_garbage": 0,
                        }
                    # Increment their pending_garbage
                    player_states[room_id][pid]["pending_garbage"] += garbage_to_send

                    # Send add_garbage message to the recipient
                    await info["socket"].send_text(
                        json.dumps({"type": "add_garbage", "count": garbage_to_send})
                    )

            # Optionally, inform the attacker of their remaining garbage lines
            await send_player_garbage_status(room_id, player_id)  # 함수 정의 후 호출
    elif message["type"] == "game_over":
        # 게임 종료 처리
        handle_game_over(room_id, player_id)


async def send_player_garbage_status(room_id: str, player_id: str):
    if room_id in player_states and player_id in player_states[room_id]:
        pending_garbage = player_states[room_id][player_id].get("pending_garbage", 0)
        await connections[room_id][player_id]["socket"].send_text(
            json.dumps({"type": "garbage_status", "pending_garbage": pending_garbage})
        )


async def cleanup_rooms():
    while True:
        db.rooms.delete_many({"current_players": {"$lte": 0}})
        await asyncio.sleep(600)  # 10분마다 실행


lobby_connections = {}  # {player_id: {"socket": websocket, "nickname": nickname}}

def broadcast_lobby_message(message: dict, exclude_player_id: str = None):
    """
    로비에 접속한 모든 사용자에게 message를 전송
    """
    closed_connections = []
    for pid, info in lobby_connections.items():
        if pid == exclude_player_id:
            continue
        try:
            asyncio.create_task(info["socket"].send_text(json.dumps(message)))
        except Exception as e:
            logger.warning(f"로비 {pid}에게 메시지 전송 실패: {e}")
            closed_connections.append(pid)

    for pid in closed_connections:
        if pid in lobby_connections:
            del lobby_connections[pid]

    log_event(f"Broadcast to lobby: {message}")