from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models.group import Group, GroupMessage, group_members
from app.models.user import User
from app.routes.users import get_current_user
import uuid

router = APIRouter(prefix="/api/groups", tags=["groups"])

class CreateGroupRequest(BaseModel):
    name: str
    description: str | None = None
    member_ids: List[str] = []

class GroupMessageRequest(BaseModel):
    content: str
    reply_to_id: str | None = None

@router.post("/")
async def create_group(
    data: CreateGroupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = Group(name=data.name, description=data.description, owner_id=current_user.id)
    db.add(group)
    await db.flush()
    await db.execute(group_members.insert().values(group_id=group.id, user_id=current_user.id))
    for mid in data.member_ids:
        try:
            await db.execute(group_members.insert().values(group_id=group.id, user_id=uuid.UUID(mid)))
        except Exception:
            pass
    await db.commit()
    await db.refresh(group)
    return {"id": str(group.id), "name": group.name, "description": group.description, "owner_id": str(group.owner_id)}

@router.get("/")
async def get_my_groups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Group).join(group_members).where(group_members.c.user_id == current_user.id)
    )
    groups = result.scalars().all()
    return [{"id": str(g.id), "name": g.name, "description": g.description, "owner_id": str(g.owner_id)} for g in groups]

@router.post("/{group_id}/messages")
async def send_group_message(
    group_id: str,
    data: GroupMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = GroupMessage(
        content=data.content,
        sender_id=current_user.id,
        group_id=uuid.UUID(group_id),
        reply_to_id=uuid.UUID(data.reply_to_id) if data.reply_to_id else None
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    reply = None
    if msg.reply_to_id:
        r = await db.execute(select(GroupMessage).where(GroupMessage.id == msg.reply_to_id))
        reply_msg = r.scalar_one_or_none()
        if reply_msg:
            u = await db.execute(select(User).where(User.id == reply_msg.sender_id))
            ru = u.scalar_one_or_none()
            reply = {
                "id": str(reply_msg.id),
                "content": reply_msg.content,
                "sender_name": (ru.display_name or ru.username) if ru else "Unknown"
            }

    return {
        "id": str(msg.id),
        "content": msg.content,
        "sender_id": str(msg.sender_id),
        "sender_name": current_user.display_name or current_user.username,
        "group_id": str(msg.group_id),
        "is_pinned": msg.is_pinned,
        "reply_to_id": str(msg.reply_to_id) if msg.reply_to_id else None,
        "reply_to": reply,
        "created_at": msg.created_at.isoformat()
    }

@router.get("/{group_id}/messages")
async def get_group_messages(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(GroupMessage).where(
            GroupMessage.group_id == uuid.UUID(group_id)
        ).order_by(GroupMessage.created_at.asc())
    )
    msgs = result.scalars().all()
    out = []
    for m in msgs:
        user_res = await db.execute(select(User).where(User.id == m.sender_id))
        u = user_res.scalar_one_or_none()
        reply = None
        if m.reply_to_id:
            r = await db.execute(select(GroupMessage).where(GroupMessage.id == m.reply_to_id))
            reply_msg = r.scalar_one_or_none()
            if reply_msg:
                ru_res = await db.execute(select(User).where(User.id == reply_msg.sender_id))
                ru = ru_res.scalar_one_or_none()
                reply = {
                    "id": str(reply_msg.id),
                    "content": reply_msg.content,
                    "sender_name": (ru.display_name or ru.username) if ru else "Unknown"
                }
        out.append({
            "id": str(m.id),
            "content": m.content,
            "sender_id": str(m.sender_id),
            "sender_name": (u.display_name or u.username) if u else "Unknown",
            "group_id": str(m.group_id),
            "is_pinned": m.is_pinned,
            "reply_to_id": str(m.reply_to_id) if m.reply_to_id else None,
            "reply_to": reply,
            "created_at": m.created_at.isoformat()
        })
    return out

@router.patch("/{group_id}/messages/{message_id}/pin")
async def pin_group_message(
    group_id: str,
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(GroupMessage).where(GroupMessage.id == uuid.UUID(message_id)))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_pinned = not msg.is_pinned
    await db.commit()
    return {"id": str(msg.id), "is_pinned": msg.is_pinned}
