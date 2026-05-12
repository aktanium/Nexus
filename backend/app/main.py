from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
from app.routes import auth, users, messages, groups, ai
from app.services.websocket_manager import manager
from app.core.security import decode_token
import json

app = FastAPI(title="Nexus Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nexus-seven-peach-22.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for stmt in [
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id)",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE",
            "ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES group_messages(id)",
            "ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE",
        ]:
            await conn.execute(text(stmt))

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(groups.router)
app.include_router(ai.router)

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)

    online_list = manager.get_online_users()
    await manager.send_to_user(user_id, {
        "type": "online_users_list",
        "user_ids": online_list
    })

    await manager.broadcast({
        "type": "user_online",
        "user_id": user_id
    }, exclude=user_id)

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            if msg_type == "message":
                receiver_id = msg.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, msg)

            elif msg_type == "group_message":
                sender_id = msg.get("sender_id", user_id)
                members = msg.get("member_ids", [])
                for member_id in members:
                    if member_id != sender_id:
                        await manager.send_to_user(member_id, msg)

            elif msg_type == "typing":
                receiver_id = msg.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, {
                        "type": "typing",
                        "sender_id": user_id
                    })

            elif msg_type == "message_deleted":
                receiver_id = msg.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, msg)

            elif msg_type == "message_pinned":
                receiver_id = msg.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, msg)

            elif msg_type == "ping":
                await manager.send_to_user(user_id, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast({
            "type": "user_offline",
            "user_id": user_id
        })

@app.get("/")
async def root():
    return {"message": "Nexus Chat API is running 🚀"}

@app.get("/health")
async def health():
    return {"status": "ok", "online_users": len(manager.get_online_users())}
