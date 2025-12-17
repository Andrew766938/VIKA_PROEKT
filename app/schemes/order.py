from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderItem(BaseModel):
    menu_item_id: int
    quantity: int

class OrderCreate(BaseModel):
    table_id: int
    items: List[OrderItem]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    items: Optional[List[OrderItem]] = None

class OrderResponse(BaseModel):
    id: int
    table_id: int
    status: str
    items: List[dict]
    total_price: float
    waiter_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
