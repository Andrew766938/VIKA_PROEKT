#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для инициализации базы данных и создания таблиц
"""

import os
from app.database.core import Base, engine, SessionLocal
from app.models.user import User
from app.models.menu import MenuItem
from app.models.table import RestaurantTable
from app.models.order import Order
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    """Инициализация БД и создание тестовых данных"""
    print("[INIT] Initializing database...")
    
    # УДАЛЯЕМ ВСЕ СТАРЫЕ ТАБЛИЦЫ И ПЕРЕСОЗДАЁМ ВСЁ С НУЛЯ
    Base.metadata.drop_all(bind=engine)
    print("[OK] Dropped all existing tables")
    
    # Создаём все таблицы заново
    Base.metadata.create_all(bind=engine)
    print("[OK] Created all tables")
    
    # Создаём тестовых пользователей
    db = SessionLocal()
    
    try:
        print("[OK] Test users created:")
        
        # Повар (ПОВАР!)
        chef = User(
            username="chefNum1",
            password_hash=pwd_context.hash("chef123"),
            full_name="Олег Козлов",
            role="chef",
            is_active=True
        )
        db.add(chef)
        print("     Chef: chefNum1 / chef123")
        
        # Официант
        waiter = User(
            username="waiterNum1",
            password_hash=pwd_context.hash("waiter123"),
            full_name="Иван Петров",
            role="waiter",
            is_active=True
        )
        db.add(waiter)
        print("     Waiter: waiterNum1 / waiter123")
        
        # Администратор
        admin = User(
            username="adminNum1",
            password_hash=pwd_context.hash("admin123"),
            full_name="Александр Иванович",
            role="admin",
            is_active=True
        )
        db.add(admin)
        print("     Admin: adminNum1 / admin123")
        
        db.commit()
        
        # Создаём тестовое меню
        print("[OK] Menu items created (6 items)")
        
        menu_items = [
            # ЗАКУСКИ
            MenuItem(
                name="Салат Цезарь",
                description="Классический салат с курицей, пармезаном и соусом Цезарь",
                price=450.00,
                category="Закуски",
                is_available=True
            ),
            MenuItem(
                name="Крем-суп из грибов",
                description="Нежный суп из белых грибов со сливками и гренками",
                price=320.00,
                category="Закуски",
                is_available=True
            ),
            MenuItem(
                name="Брускетта с помидорами",
                description="Хрустящий хлеб с помидорами, чесноком и оливковым маслом",
                price=280.00,
                category="Закуски",
                is_available=True
            ),
            
            # ОСНОВНЫЕ БЛЮДА
            MenuItem(
                name="Стейк из говядины",
                description="Мраморная говядина, приготовленная на гриле, с овощами",
                price=1200.00,
                category="Основные блюда",
                is_available=True
            ),
            MenuItem(
                name="Паста Болонье",
                description="Спагетти с мясным соусом и пармезаном",
                price=550.00,
                category="Основные блюда",
                is_available=True
            ),
            MenuItem(
                name="Курица в сливочном соусе",
                description="Нежная куриная грудка с грибами и сливочным соусом",
                price=580.00,
                category="Основные блюда",
                is_available=True
            ),
        ]
        
        for item in menu_items:
            db.add(item)
        
        db.commit()
        
        # Создаём тестовые столы
        print("[OK] Restaurant tables created (6 tables)")
        
        tables = [
            RestaurantTable(table_number=1, seats=2, is_occupied=False),
            RestaurantTable(table_number=2, seats=2, is_occupied=False),
            RestaurantTable(table_number=3, seats=4, is_occupied=False),
            RestaurantTable(table_number=4, seats=4, is_occupied=False),
            RestaurantTable(table_number=5, seats=6, is_occupied=False),
            RestaurantTable(table_number=6, seats=6, is_occupied=False),
        ]
        
        for table in tables:
            db.add(table)
        
        db.commit()
        
        print("\n[SUCCESS] Database initialization complete!")
        
    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
