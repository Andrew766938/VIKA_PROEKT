from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemes.menu import MenuItemCreate, MenuItemUpdate, MenuItemResponse
from app.models.menu import MenuItem
from app.database.core import get_db

router = APIRouter(prefix="/api/menu", tags=["menu"])

@router.get("/", response_model=List[MenuItemResponse])
def get_all_menu_items(db: Session = Depends(get_db)):
    """Get all menu items"""
    items = db.query(MenuItem).all()
    return items

@router.get("/{item_id}", response_model=MenuItemResponse)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    """Get specific menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item

@router.post("/", response_model=MenuItemResponse)
def create_menu_item(item_data: MenuItemCreate, db: Session = Depends(get_db)):
    """Create new menu item"""
    new_item = MenuItem(**item_data.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=MenuItemResponse)
def update_menu_item(item_id: int, item_data: MenuItemUpdate, db: Session = Depends(get_db)):
    """Update menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    update_data = item_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    """Delete menu item"""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Menu item deleted successfully"}
