# Tetris/backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import lobby, game, admin, auth, clients
from app.utils.shared import connections
from app.models import db
from app.utils.websocket_manager import (
    handle_disconnection,
    handle_websocket_message,
    cleanup_rooms,
    broadcast,
    player_states,
    lobby_connections,        # 새로 추가할 전역 변수 (아래 예시)
    broadcast_lobby_message   # 로비용 broadcast 함수
)
from app.utils.auth import decode_access_token, get_current_user
import asyncio
import json
import uuid
from fastapi import HTTPException, status

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(lobby.router, prefix="/api")
app.include_router(game.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin")
app.include_router(clients.router, prefix="/api")
app.state.connections = connections

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_rooms())

# 로비용 WebSocket 접속 관리용 전역 변수
lobby_connections = {}  # {player_id: {"socket": websocket, "nickname": nickname}}

@app.websocket("/ws/lobby")
async def lobby_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        initial_data = await websocket.receive_text()
        initial_message = json.loads(initial_data)
        token = initial_message.get("token")
        if not token:
            await websocket.close(code=1008, reason="토큰이 제공되지 않았습니다.")
            return
        username = decode_access_token(token)
        if not username:
            await websocket.close(code=1008, reason="유효하지 않은 토큰입니다.")
            return

        user = db.users.find_one({"username": username})
        if not user:
            await websocket.close(code=1008, reason="사용자를 찾을 수 없습니다.")
            return

        nickname = user["nickname"]
        player_id = str(uuid.uuid4())

        lobby_connections[player_id] = {"socket": websocket, "nickname": nickname}
        
        # 로비에 새 유저 접속 알림 (원하면 알림가능)
        # broadcast_lobby_message({"type": "lobby_update", "message": f"{nickname} 님이 로비에 접속했습니다."})
        
        # 로비 내 채팅 수신 대기
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # lobby_chat 메시지 처리
            if message.get("type") == "lobby_chat":
                # 모든 로비 참가자에게 전송
                broadcast_lobby_message({"type": "lobby_chat", "sender": nickname, "message": message["message"]})
                
    except WebSocketDisconnect:
        # 로비에서 연결 종료 처리
        for pid, info in list(lobby_connections.items()):
            if info["socket"] == websocket:
                del lobby_connections[pid]
                # broadcast_lobby_message({"type": "lobby_update", "message": f"{info['nickname']} 님이 로비를 나갔습니다."})
                break
    except Exception as e:
        await websocket.close(code=1011)
        for pid, info in list(lobby_connections.items()):
            if info["socket"] == websocket:
                del lobby_connections[pid]
                break


# WebSocket 엔드포인트 설정
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()

    try:
        # 첫 번째 메시지로 JWT 토큰을 받아 인증 처리
        initial_data = await websocket.receive_text()
        initial_message = json.loads(initial_data)
        token = initial_message.get("token")
        player_id = initial_message.get("player_id")

        if not token:
            await websocket.close(code=1008, reason="토큰이 제공되지 않았습니다.")
            return

        username = decode_access_token(token)  # decode_access_token 가져오기
        if not username:
            await websocket.close(code=1008, reason="유효하지 않은 토큰입니다.")
            return

        if not player_id:
            player_id = str(uuid.uuid4())

        # 사용자 정보 가져오기
        user = db.users.find_one({"username": username})
        if not user:
            await websocket.close(code=1008, reason="사용자를 찾을 수 없습니다.")
            return

        nickname = user["nickname"]  # 사용자 닉네임을 nickname으로 설정

        if room_id not in connections:
            connections[room_id] = {}

        connections[room_id][player_id] = {"socket": websocket, "nickname": nickname}

        # player_states 초기화 추가
        if room_id not in player_states:
            player_states[room_id] = {}
        if player_id not in player_states[room_id]:
            player_states[room_id][player_id] = {
                "nickname": nickname,
                "finished_at": None,
                "pending_garbage": 0,
            }

        room = db.rooms.find_one({"room_id": room_id})
        if room:
            player_nicknames = [
                info["nickname"] for info in connections[room_id].values()
            ]
            broadcast_info = {
                "type": "update_players",
                "players": player_nicknames,
                "host": room["host"],
                "title": room["title"],  # 방 제목 추가
            }
            broadcast(room_id, broadcast_info)

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_websocket_message(room_id, player_id, message)

    except WebSocketDisconnect:
        handle_disconnection(room_id, player_id)
    except Exception as e:
        logger.error(f"[오류] WebSocket 처리 중 예외 발생: {e}")
        await websocket.close(code=1011)  # 내부 서버 오류 코드로 연결 종료
        handle_disconnection(room_id, player_id)
