import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy import create_engine
from sqladmin import Admin, ModelView

from app.database.core import Base, engine
from app.database.models import User, MenuItem, Table

# Import all routers
from app.api.auth import router as auth_router
from app.api.menu import router as menu_router
from app.api.tables import router as tables_router
from app.api.orders import router as orders_router
from app.api.employees import router as employees_router

app = FastAPI(
    title="Platter Flow - Restaurant Management",
    description="API for restaurant management system",
    version="1.0.0"
)

# Create tables on startup (only structure, not data)
Base.metadata.create_all(bind=engine)
# NOTE: init_db() is removed - run it manually once with: python init_db.py

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Include routers
app.include_router(auth_router)
app.include_router(menu_router)
app.include_router(tables_router)
app.include_router(orders_router)
app.include_router(employees_router)

# ==================== SQLAdmin Configuration ====================

class UserAdmin(ModelView, model=User):
    """Админ-панель для пользователей"""
    column_list = [User.id, User.username, User.full_name, User.role]
    name = "Сотрудник"
    name_plural = "Сотрудники"
    icon = "fa-solid fa-user"

class MenuItemAdmin(ModelView, model=MenuItem):
    """Админ-панель для меню"""
    column_list = [MenuItem.id, MenuItem.name, MenuItem.description, MenuItem.price, MenuItem.category]
    name = "Блюдо"
    name_plural = "Меню"
    icon = "fa-solid fa-utensils"

class TableAdmin(ModelView, model=Table):
    """Админ-панель для столов"""
    column_list = [Table.id, Table.table_number, Table.seats, Table.is_occupied]
    name = "Стол"
    name_plural = "Столы"
    icon = "fa-solid fa-chair"

# Регистрируем админ-панель
admin = Admin(app, engine, title="🍽️ Platter Flow Admin", authentication_backend=None)

admin.add_model_view(UserAdmin)
admin.add_model_view(MenuItemAdmin)
admin.add_model_view(TableAdmin)

# ==================== Routes ====================

# Root route - serve the HTML interface
@app.get("/")
def root():
    """Serve the main HTML interface"""
    html_file = static_dir / "index.html"
    if html_file.exists():
        return FileResponse(html_file)
    return {"message": "Welcome to Platter Flow API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
