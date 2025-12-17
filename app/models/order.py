from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, ready, completed, cancelled
    items = Column(JSON, nullable=False)  # [{"menu_item_id": 1, "quantity": 2}, ...]
    total_price = Column(Float, nullable=False)
    waiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
