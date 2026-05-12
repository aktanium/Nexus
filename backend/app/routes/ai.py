from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from groq import Groq
from app.core.config import settings
from app.routes.users import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/ai", tags=["ai"])

class SuggestRequest(BaseModel):
    conversation: List[dict]
    last_message: str

@router.post("/suggest")
async def suggest_reply(
    data: SuggestRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        history = []
        for msg in data.conversation[-6:]:
            role = "user" if msg.get("sender_id") != str(current_user.id) else "assistant"
            history.append({"role": role, "content": msg.get("content", "")})

        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful chat assistant. Suggest a short, natural, friendly reply to the last message. Give ONLY the reply text, no explanations, no quotes. Maximum 2 sentences."
                },
                *history,
                {
                    "role": "user",
                    "content": f"Suggest a reply to: {data.last_message}"
                }
            ],
            max_tokens=100,
            temperature=0.7,
        )
        suggestion = response.choices[0].message.content.strip()
        return {"suggestion": suggestion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
