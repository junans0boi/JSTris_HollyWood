# Tetris/backend/app/routers/clients.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.auth import get_current_user
from app.utils.shared import connections

router = APIRouter()

@router.get("/clients")
async def get_connected_clients(current_user: dict = Depends(get_current_user)):
    """
    현재 서버에 접속 중인 모든 클라이언트의 닉네임 목록을 반환합니다.
    본인(nickname)은 제외됩니다.
    """
    connected_clients = set()
    for room_id, players in connections.items():
        for player_id, info in players.items():
            if info["nickname"] != current_user["nickname"]:  # 본인 제외
                connected_clients.add(info["nickname"])
    return {"clients": list(connected_clients)}
