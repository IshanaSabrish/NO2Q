from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from beanie import Document, PydanticObjectId

class RestaurantModel(Document):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    owner_id: str
    name: str
    location: str
    approved: bool = False
    disabled: bool = False
    images: List[str] = []
    menu_url: str = ""
    menu_images: List[str] = []
    fssai: str = ""  # URL to doc
    gst: str = ""  # URL to doc
    fssai_number: str = ""  # Actual Number
    gst_number: str = ""  # Actual Number
    qr_code: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "restaurants"

class RestaurantCreate(BaseModel):
    name: str
    location: str
    owner_id: str
    fssai: str = ""
    gst: str = ""
    fssai_number: str = ""
    gst_number: str = ""
    images: List[str] = []
    menu_url: str = ""
    menu_images: List[str] = []
