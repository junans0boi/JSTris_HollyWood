# Tetris/backend/app/routers/admin.py
from fastapi import APIRouter, HTTPException
from app.models import db

router = APIRouter()

@router.post("/init-db")
async def initialize_database():
    """
    이 엔드포인트는 DB 컬렉션을 초기화하는 역할을 합니다.
    예: 'rooms' 컬렉션 삭제 후, 필요한 인덱스 생성 등.
    """
    try:
        # 초기화할 컬렉션 목록
        collections_to_init = ["rooms", "players", "scores"]

        for collection_name in collections_to_init:
            db[collection_name].drop()  # 컬렉션 드롭(전체 삭제)

        # 예: rooms 컬렉션 초기 설정(인덱스 추가 또는 기본 데이터 삽입)
        db["rooms"].create_index("room_id", unique=True)
        
        # 필요하다면 초기 데이터 삽입
        # db["rooms"].insert_one({
        #     "room_id": "1",
        #     "title": "기본 방",
        #     "password": None,
        #     "max_players": 4,
        #     "current_players": 0,
        #     "host": "admin",
        #     "createdAt": datetime.utcnow()
        # })

        return {"message": "데이터베이스 초기화가 완료되었습니다."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 초기화 중 오류 발생: {e}")
