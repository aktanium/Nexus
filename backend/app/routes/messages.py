from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from pydantic import BaseModel
from app.database import get_db
from app.models.message import Message
from app.models.user import User
from app.routes.users import get_current_user
import uuid
import base64

router = APIRouter(prefix="/api/messages", tags=["messages"])

class SendMessageRequest(BaseModel):
    receiver_id: str
    content: str
    reply_to_id: str | None = None

def format_message(m, reply=None):
    return {
        "id": str(m.id),
        "content": m.content,
        "sender_id": str(m.sender_id),
        "receiver_id": str(m.receiver_id),
        "is_read": m.is_read,
        "is_pinned": m.is_pinned,
        "reply_to_id": str(m.reply_to_id) if m.reply_to_id else None,
        "reply_to": {
            "id": str(reply.id),
            "content": reply.content,
            "sender_id": str(reply.sender_id)
        } if reply else None,
        "created_at": m.created_at.isoformat()
    }

@router.post("/")
async def send_message(
    data: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = Message(
        content=data.content,
        sender_id=current_user.id,
        receiver_id=uuid.UUID(data.receiver_id),
        reply_to_id=uuid.UUID(data.reply_to_id) if data.reply_to_id else None
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    reply = None
    if message.reply_to_id:
        r = await db.execute(select(Message).where(Message.id == message.reply_to_id))
        reply = r.scalar_one_or_none()

    return format_message(message, reply)

@router.get("/conversation/{user_id}")
async def get_conversation(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Message).where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == uuid.UUID(user_id)),
                and_(Message.sender_id == uuid.UUID(user_id), Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    out = []
    for m in messages:
        reply = None
        if m.reply_to_id:
            r = await db.execute(select(Message).where(Message.id == m.reply_to_id))
            reply = r.scalar_one_or_none()
        out.append(format_message(m, reply))
    return out

@router.get("/pinned/{user_id}")
async def get_pinned(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Message).where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == uuid.UUID(user_id)),
                and_(Message.sender_id == uuid.UUID(user_id), Message.receiver_id == current_user.id)
            ),
            Message.is_pinned == True
        ).order_by(Message.created_at.desc())
    )
    messages = result.scalars().all()
    return [format_message(m) for m in messages]

@router.patch("/{message_id}/pin")
async def toggle_pin(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Message).where(Message.id == uuid.UUID(message_id)))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_pinned = not msg.is_pinned
    await db.commit()
    return {"id": str(msg.id), "is_pinned": msg.is_pinned}

@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Message).where(Message.id == uuid.UUID(message_id)))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete other's message")
    await db.delete(msg)
    await db.commit()
    return {"deleted": True, "id": message_id}

@router.get("/search")
async def search_messages(
    q: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Message).where(
            Message.content.ilike(f"%{q}%"),
            or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
        ).order_by(Message.created_at.desc())
    )
    messages = result.scalars().all()
    return [format_message(m) for m in messages]

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
    b64 = base64.b64encode(contents).decode()
    data_url = f"data:{file.content_type};base64,{b64}"
    return {"image_url": data_url}
