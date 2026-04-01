from pydantic import BaseModel, Field


class AuthLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


class AuthSessionResponse(BaseModel):
    authenticated: bool
    user_id: int | None = None
    username: str | None = None
    trade: str | None = None
