from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.core.security import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid

router = APIRouter(prefix="/api/users", tags=["users"])
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/")
async def get_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(User).where(User.id != current_user.id))
    users = result.scalars().all()
    return [{"id": str(u.id), "username": u.username, "display_name": u.display_name, "avatar_url": u.avatar_url, "is_online": u.is_online} for u in users]

@router.get("/search")
async def search_users(q: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(User).where(
        or_(User.username.ilike(f"%{q}%"), User.display_name.ilike(f"%{q}%")),
        User.id != current_user.id
    ))
    users = result.scalars().all()
    return [{"id": str(u.id), "username": u.username, "display_name": u.display_name, "avatar_url": u.avatar_url, "is_online": u.is_online} for u in users]

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "username": current_user.username, "display_name": current_user.display_name, "email": current_user.email, "avatar_url": current_user.avatar_url}

class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    username: str | None = None

@router.patch("/me")
async def update_me(
    data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.username and data.username != current_user.username:
        result = await db.execute(
            select(User).where(User.username == data.username, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.username
    if data.display_name is not None:
        current_user.display_name = data.display_name
    await db.commit()
    await db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "display_name": current_user.display_name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
    }
