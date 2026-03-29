from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.quotes import QuoteRead, QuoteUpdate


ChatRole = Literal["user", "assistant", "system"]
AssistantAction = Literal["ask_question", "update_quote"]


class QuoteChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class AssistantReply(BaseModel):
    action: AssistantAction
    assistant_message: str = Field(min_length=1, max_length=4000)
    quote_patch: QuoteUpdate | None = None


class QuoteChatResponse(BaseModel):
    action: AssistantAction
    assistant_message: str
    quote: QuoteRead
