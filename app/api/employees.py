from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemes.user import UserCreate, UserUpdate, UserResponse
from app.models.user import User
from app.database.core import get_db
from passlib.context import CryptContext

router = APIRouter(prefix="/api/employees", tags=["employees"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

@router.get("/", response_model=List[UserResponse])
def get_all_employees(db: Session = Depends(get_db)):
    """Get all employees"""
    employees = db.query(User).all()
    return employees

@router.get("/role/{role}", response_model=List[UserResponse])
def get_employees_by_role(role: str, db: Session = Depends(get_db)):
    """Get employees by role"""
    employees = db.query(User).filter(User.role == role).all()
    return employees

@router.get("/{employee_id}", response_model=UserResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get specific employee"""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("/", response_model=UserResponse)
def create_employee(employee_data: UserCreate, db: Session = Depends(get_db)):
    """Create new employee (admin only)"""
    existing = db.query(User).filter(User.username == employee_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_employee = User(
        username=employee_data.username,
        password_hash=hash_password(employee_data.password),
        full_name=employee_data.full_name,
        role=employee_data.role
    )
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee

@router.put("/{employee_id}", response_model=UserResponse)
def update_employee(employee_id: int, employee_data: UserUpdate, db: Session = Depends(get_db)):
    """Update employee"""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if employee_data.full_name:
        employee.full_name = employee_data.full_name
    if employee_data.password:
        employee.password_hash = hash_password(employee_data.password)
    if employee_data.is_active is not None:
        employee.is_active = employee_data.is_active
    
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """Delete employee"""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(employee)
    db.commit()
    return {"message": "Employee deleted successfully"}
