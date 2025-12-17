from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemes.order import OrderCreate, OrderUpdate, OrderResponse
from app.models.order import Order
from app.models.menu import MenuItem
from app.models.table import RestaurantTable
from app.database.core import get_db

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.get("/", response_model=List[OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    """Get all orders"""
    orders = db.query(Order).all()
    return orders

@router.get("/status/{status}", response_model=List[OrderResponse])
def get_orders_by_status(status: str, db: Session = Depends(get_db)):
    """Get orders by status"""
    orders = db.query(Order).filter(Order.status == status).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get specific order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """Create new order"""
    table = db.query(RestaurantTable).filter(RestaurantTable.id == order_data.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Calculate total price
    total_price = 0
    items_data = []
    for item in order_data.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item.menu_item_id} not found")
        total_price += menu_item.price * item.quantity
        items_data.append({
            "menu_item_id": item.menu_item_id,
            "name": menu_item.name,
            "quantity": item.quantity,
            "price": menu_item.price
        })
    
    new_order = Order(
        table_id=order_data.table_id,
        items=items_data,
        total_price=total_price,
        status="pending"
    )
    
    table.is_occupied = True
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order_data: OrderUpdate, db: Session = Depends(get_db)):
    """Update order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order_data.status:
        order.status = order_data.status
        if order_data.status == "completed" or order_data.status == "cancelled":
            table = db.query(RestaurantTable).filter(RestaurantTable.id == order.table_id).first()
            if table:
                table.is_occupied = False
    
    db.commit()
    db.refresh(order)
    return order

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    table = db.query(RestaurantTable).filter(RestaurantTable.id == order.table_id).first()
    if table:
        table.is_occupied = False
    
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}
