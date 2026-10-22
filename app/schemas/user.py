from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "employee"

    @field_validator("role")
    @classmethod
    def validate_role(cls, value):
        allowed_roles = ["admin", "manager", "employee"]

        if value.lower() not in allowed_roles:
            raise ValueError(
                "Role must be admin, manager or employee."
            )

        return value.lower()


class UserUpdate(BaseModel):
    name: str
    email: EmailStr
    role: str
    password: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value):
        allowed_roles = ["admin", "manager", "employee"]

        if value.lower() not in allowed_roles:
            raise ValueError(
                "Role must be admin, manager or employee."
            )

        return value.lower()


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True