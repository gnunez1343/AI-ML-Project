"""Auth endpoints: register, login, logout, me."""
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.security import (
    COOKIE_NAME,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ──────────────────────────────────────────────────────────────────

LICENSE_TYPES = ["LCSW", "LMFT", "PsyD", "PhD", "MD", "LPC", "LPCC", "Other"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    license_type: str
    practice_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    license_type: str
    practice_name: str
    role: str


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,   # set True behind HTTPS in production
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 hours
        path="/",
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    if body.license_type not in LICENSE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"license_type must be one of {LICENSE_TYPES}",
        )
    existing = await _get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        license_type=body.license_type,
        practice_name=body.practice_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id)
    _set_auth_cookie(response, token)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        license_type=user.license_type,
        practice_name=user.practice_name,
        role=user.role,
    )


@router.post("/login", response_model=UserResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await _get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = create_access_token(user.id)
    _set_auth_cookie(response, token)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        license_type=user.license_type,
        practice_name=user.practice_name,
        role=user.role,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        license_type=current_user.license_type,
        practice_name=current_user.practice_name,
        role=current_user.role,
    )
