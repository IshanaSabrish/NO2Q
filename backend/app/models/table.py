from pydantic import BaseModel, Field
from typing import Optional
from beanie import Document, PydanticObjectId

class TableModel(Document):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    restaurant_id: str
    number: int
    seats: int
    status: str = "empty" # empty, cleaning, full

    class Settings:
        name = "tables"

class TableCreate(BaseModel):
    restaurant_id: str
    number: int
    seats: int
