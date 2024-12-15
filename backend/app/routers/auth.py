from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.models import db, User
from app.utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)
from datetime import timedelta, datetime

router = APIRouter(
    tags=["Authentication"]  # prefix 제거
)

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    nickname: str  # 닉네임 필드 추가

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    nickname: str  # 닉네임 필드 추가

@router.post("/register", response_model=Token)
async def register(request: RegisterRequest):
    # 사용자 존재 여부 확인
    existing_user = db.users.find_one({"username": request.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 사용자입니다."
        )

    # 닉네임 중복 확인
    existing_nickname = db.users.find_one({"nickname": request.nickname})
    if existing_nickname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 닉네임입니다."
        )

    # 비밀번호 해싱
    hashed_password = get_password_hash(request.password)

    # 사용자 데이터베이스에 저장
    user = {
        "username": request.username,
        "email": request.email,
        "hashed_password": hashed_password,
        "nickname": request.nickname,  # 닉네임 저장
        "created_at": datetime.utcnow()
    }
    db.users.insert_one(user)

    # JWT 토큰 생성
    access_token = create_access_token(
        data={"sub": request.username},
        expires_delta=timedelta(minutes=60)
    )

    return {"access_token": access_token, "token_type": "bearer", "nickname": request.nickname}

@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    user = db.users.find_one({"username": request.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": request.username},
        expires_delta=timedelta(minutes=60)
    )

    nickname = user.get("nickname", request.username)  # 닉네임 가져오기

    return {"access_token": access_token, "token_type": "bearer", "nickname": nickname}

# 현재 사용자 가져오기
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    username = decode_access_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 자격 증명입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

