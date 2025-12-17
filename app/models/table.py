from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database.core import Base

class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"
    
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer, nullable=False, unique=True)
    seats = Column(Integer, nullable=False)
    is_occupied = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
