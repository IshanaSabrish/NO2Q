from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from beanie import Document, PydanticObjectId

class TokenModel(Document):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    restaurant_id: str
    user_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    token_number: str
    group_size: int
    status: str = "waiting"  # waiting, called, delayed, dining, completed, cancelled, no_show
    position: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    called_at: Optional[datetime] = None
    dining_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_time_mins: int = 0
    assigned_table_id: Optional[str] = None
    assigned_table_number: Optional[str] = None

    class Settings:
        name = "tokens"

class TokenCreate(BaseModel):
    restaurant_id: str
    user_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    group_size: int
