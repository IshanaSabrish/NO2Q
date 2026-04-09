from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from beanie import Document
from datetime import datetime

from beanie import Document, PydanticObjectId

class UserModel(Document):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    name: str
    phone: str
    email: Optional[EmailStr] = None # Only for owner/admin
    role: str # 'customer', 'owner', 'admin'
    password_hash: Optional[str] = None
    status: str = "approved" # 'pending', 'approved' (owner starts pending)
    
    class Settings:
        name = "users"

class UserCreate(BaseModel):
    name: str
    phone: str
    role: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    status: str = "approved"

class UserLogin(BaseModel):
    identifier: str # Email or Phone
    password: Optional[str] = None # OTP for customer

class LoginResponse(BaseModel):
    token: str
    role: str
    status: str
    user_id: str
