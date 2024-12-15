# app/routers/lobby.py

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, validator
from app.models import Room, db
from datetime import datetime
from typing import Optional, List
import uuid
from app.routers.auth import get_current_user
import socket
from app.utils.websocket_manager import broadcast  # Ensure broadcast is imported

router = APIRouter()


def send_stats_to_processor(stats: dict):
    HOST = "localhost"  # 통신할 호스트
    PORT = 65432  # 통신할 포트

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((HOST, PORT))
            s.sendall(json.dumps(stats).encode())
            print("Sent stats to processor")
    except ConnectionRefusedError:
        logger.error("Stats processor is not running.")
    except Exception as e:
        logger.error(f"Error sending stats: {e}")


class RoomRequest(BaseModel):
    title: str
    is_private: bool = False
    password: Optional[str] = None
    max_players: int

    @validator("title", pre=True, always=True)
    def validate_strings(cls, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("유효한 문자열이어야 합니다.")
        return value.strip()

    @validator("password", always=True)
    def validate_password(cls, value, values):
        if values.get("is_private") and not value:
            raise ValueError("비공개 방은 비밀번호가 필요합니다.")
        if not values.get("is_private"):
            # 공개 방인 경우 password 무시
            return None
        return value.strip() if value else None

    @validator("max_players")
    def validate_max_players(cls, value):
        if value < 2:
            raise ValueError("최소 2명 이상의 플레이어가 필요합니다.")
        return value


# Player 모델에서 nickname 제거
class Player(BaseModel):
    password: Optional[str] = None


@router.get("/rooms")
async def get_rooms():
    # 현재 방 목록 반환
    rooms = list(db.rooms.find({}, {"_id": 0}))
    return {"rooms": rooms}


@router.post("/rooms")
async def create_room(
    room: RoomRequest, current_user: dict = Depends(get_current_user)
):
    if not room.is_private:
        room.password = None  # 공개 방은 비밀번호 제거

    # UUID를 활용하여 unique room_id 생성
    room_id = str(uuid.uuid4())

    new_room_data = Room(
        room_id=room_id,
        title=room.title,
        password=room.password,
        max_players=room.max_players,
        current_players=1,
        host=current_user["nickname"],
        createdAt=datetime.utcnow(),
        joined_players=[current_user["nickname"]],
        game_started=False,
    ).dict()

    # player_states 초기화 제거
    db.rooms.insert_one(new_room_data)
    return {
        "room_id": room_id,
        "message": "방이 성공적으로 생성되었습니다.",
        "host": current_user["nickname"],
    }


@router.post("/rooms/{room_id}/join")
async def join_room(
    room_id: str, player: Player, current_user: dict = Depends(get_current_user)
):
    room = db.rooms.find_one({"room_id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="방을 찾을 수 없습니다.")

    # 게임이 이미 시작된 방에 참가하려는 경우 거부
    if room.get("game_started"):
        raise HTTPException(status_code=403, detail="이미 게임이 시작된 방입니다.")

    # 비밀번호 검증
    if room.get("password") and room["password"] != player.password:
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")

    # 방 인원 초과 검증
    if room["current_players"] >= room["max_players"]:
        raise HTTPException(status_code=403, detail="방이 가득 찼습니다.")

    # 중복 참여 방지
    if current_user["nickname"] in room.get("joined_players", []):
        raise HTTPException(status_code=400, detail="이미 이 방에 참여하고 있습니다.")

    db.rooms.update_one(
        {"room_id": room_id},
        {
            "$push": {
                "joined_players": current_user["nickname"]
            },  # username → nickname
            "$inc": {"current_players": 1},
        },
    )
    return {"message": "방에 성공적으로 참여했습니다.", "host": room["host"]}


@router.post("/rooms/{room_id}/leave")
async def leave_room(room_id: str, current_user: dict = Depends(get_current_user)):
    room = db.rooms.find_one({"room_id": room_id})
    if not room:
        return {"message": "방이 이미 삭제되었거나 존재하지 않습니다."}

    # 해당 플레이어가 joined_players에 있는지 확인
    if current_user["nickname"] not in room.get("joined_players", []):
        return {"message": "해당 플레이어는 이 방에 있지 않습니다."}

    db.rooms.update_one(
        {"room_id": room_id},
        {
            "$inc": {"current_players": -1},
            "$pull": {
                "joined_players": current_user["nickname"]
            },  # username → nickname
        },
    )

    updated_room = db.rooms.find_one({"room_id": room_id})
    if not updated_room:
        return {"message": "방 정보 업데이트 중 문제가 발생하였습니다."}

    # 현재 플레이어 수 확인
    if updated_room["current_players"] == 0:
        db.rooms.delete_one({"room_id": room_id})
        return {
            "message": "방에서 성공적으로 나갔습니다. 방이 인원이 없어 삭제되었습니다."
        }

    # 방장 이탈 시 처리: 새로운 방장 할당
    if current_user["nickname"] == room["host"]:
        # joined_players 중 첫 번째로 새로운 방장 지정
        new_host = (
            updated_room["joined_players"][0]
            if updated_room["joined_players"]
            else None
        )
        if new_host:
            db.rooms.update_one({"room_id": room_id}, {"$set": {"host": new_host}})

    return {"message": "방에서 성공적으로 나갔습니다."}


@router.post("/rooms/{room_id}/start")
async def start_game(room_id: str, current_user: dict = Depends(get_current_user)):
    room = db.rooms.find_one({"room_id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="방을 찾을 수 없습니다.")

    if current_user["nickname"] != room["host"]:
        raise HTTPException(status_code=403, detail="방장만 게임을 시작할 수 있습니다.")

    if room.get("game_started"):
        raise HTTPException(status_code=400, detail="이미 게임이 시작되었습니다.")

    # 게임 시작 여부 업데이트
    db.rooms.update_one({"room_id": room_id}, {"$set": {"game_started": True}})
    logger.info(
        f"[DEBUG] 방 {room_id}의 game_started 필드가 True로 업데이트되었습니다."
    )

    # 게임 시작 메시지를 모든 클라이언트에게 브로드캐스트
    broadcast(room_id, {"type": "start", "title": room["title"], "host": room["host"]})
    logger.info(f"[알림] {room['title']} 방장({room['host']})가 게임을 시작했습니다.")

    return {"message": "게임이 시작되었습니다."}


def handle_game_over(room_id: str, player_id: str):
    # 기존 로직 유지...
    # 게임 종료 시 통계 전송
    if room_id in player_states:
        stats = {
            "room_id": room_id,
            "rankings": [
                player["nickname"] for player in player_states[room_id].values()
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }
        send_stats_to_processor(stats)
