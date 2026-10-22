from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=4096)

class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=4096)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=4096)
    new_password: str = Field(min_length=12, max_length=128)
