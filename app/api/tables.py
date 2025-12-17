from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemes.table import TableCreate, TableUpdate, TableResponse
from app.models.table import RestaurantTable
from app.database.core import get_db

router = APIRouter(prefix="/api/tables", tags=["tables"])

@router.get("/", response_model=List[TableResponse])
def get_all_tables(db: Session = Depends(get_db)):
    """Get all restaurant tables"""
    tables = db.query(RestaurantTable).all()
    return tables

@router.get("/{table_id}", response_model=TableResponse)
def get_table(table_id: int, db: Session = Depends(get_db)):
    """Get specific table"""
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table

@router.post("/", response_model=TableResponse)
def create_table(table_data: TableCreate, db: Session = Depends(get_db)):
    """Create new table"""
    existing = db.query(RestaurantTable).filter(
        RestaurantTable.table_number == table_data.table_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")
    
    new_table = RestaurantTable(**table_data.dict())
    db.add(new_table)
    db.commit()
    db.refresh(new_table)
    return new_table

@router.put("/{table_id}", response_model=TableResponse)
def update_table(table_id: int, table_data: TableUpdate, db: Session = Depends(get_db)):
    """Update table"""
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    update_data = table_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(table, key, value)
    
    db.commit()
    db.refresh(table)
    return table

@router.delete("/{table_id}")
def delete_table(table_id: int, db: Session = Depends(get_db)):
    """Delete table"""
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db.delete(table)
    db.commit()
    return {"message": "Table deleted successfully"}
