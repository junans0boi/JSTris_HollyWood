# /home/ubuntu/Project/Tetris/backend/app/models.py

from pydantic import BaseModel, EmailStr
from pymongo import MongoClient, ASCENDING
from typing import Optional, List
from datetime import datetime

try:
    client = MongoClient("mongodb://tetris_user:1234@localhost:27017/tetris")
    db = client.tetris
    print("MongoDB 연결 성공")
    print(db.list_collection_names())  # 컬렉션 이름 출력

    # 사용자와 닉네임의 유일성을 보장하기 위한 인덱스 생성
    db.users.create_index([("username", ASCENDING)], unique=True)
    db.users.create_index([("nickname", ASCENDING)], unique=True)
except Exception as e:
    print("MongoDB 연결 실패:", e)

class Room(BaseModel):
    room_id: str
    title: str
    password: Optional[str] = None
    max_players: int
    current_players: int
    host: str  # 방장의 닉네임
    createdAt: datetime
    joined_players: List[str]  # 참가자들의 닉네임
    game_started: bool = False  # 게임 시작 여부 필드 추가

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str
    nickname: str  # 닉네임 필드 추가
    created_at: datetime = datetime.utcnow()

