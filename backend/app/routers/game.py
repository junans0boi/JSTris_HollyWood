from fastapi import APIRouter

# APIRouter 객체 생성
router = APIRouter()

# 예제 엔드포인트 추가
@router.get("/example")
async def example_endpoint():
    return {"message": "Game router is working!"}
