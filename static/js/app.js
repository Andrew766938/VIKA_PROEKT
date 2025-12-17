const API_URL = window.location.origin; // Используем тот же домен

// Global state
let currentUser = null;
let currentTab = 'menuTab';
let isLoginMode = true; // true = вход, false = регистрация
let cart = []; // Корзина со товарами
let allMenuItems = []; // Все товары из меню

// Elements
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loginBtn = document.getElementById('doLogin');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const menuBtns = document.querySelectorAll('.menu-btn');

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
menuBtns.forEach(btn => {
    btn.addEventListener('click', (e) => handleTabSwitch(e.target));
});

// Toggle between login and register
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const form = document.getElementById('authForm');
    const title = document.querySelector('.auth-card h2');
    const roleGroup = document.getElementById('roleGroup');
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const submitBtn = document.getElementById('doLogin');
    
    if (isLoginMode) {
        title.textContent = '🔐 Вход';
        roleGroup.classList.add('hidden');
        toggleBtn.textContent = 'Создать аккаунт';
        submitBtn.textContent = '🔐 Вход';
        document.getElementById('loginUser').placeholder = 'Введите логин';
    } else {
        title.textContent = '📝 Регистрация';
        roleGroup.classList.remove('hidden');
        toggleBtn.textContent = 'Уже есть аккаунт? Войти';
        submitBtn.textContent = '✅ Зарегистрироваться';
        document.getElementById('loginUser').placeholder = 'Выберите логин';
    }
    
    // Clear form
    form.reset();
}

// Functions
async function handleLogin() {
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    const fullName = document.getElementById('loginName')?.value;
    const role = document.getElementById('loginRole')?.value;

    if (!username || !password) {
        alert('Пожалуйста, заполните все поля');
        return;
    }

    try {
        if (isLoginMode) {
            // Login
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert('❌ Ошибка входа: ' + (errorData.detail || 'Проверьте логин и пароль'));
                return;
            }

            const data = await response.json();
            currentUser = data;
            cart = []; // Очистим корзину при входе

            // Show app section, hide auth
            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');

            // Update UI
            document.getElementById('userName').textContent = data.full_name;
            document.getElementById('userRole').textContent = getRoleText(data.role);

            // Show/hide features based on role
            const ordersMenuBtn = Array.from(document.querySelectorAll('.menu-btn')).find(btn => btn.getAttribute('data-tab') === 'ordersTab');
            const cartBtn = document.getElementById('cartMenuBtn');
            const employeesBtn = document.getElementById('employeesMenuBtn');
            
            if (data.role === 'admin') {
                // Admin sees: Menu, Tables, Orders, Employees
                if (ordersMenuBtn) ordersMenuBtn.classList.remove('hidden');
                employeesBtn.classList.remove('hidden');
                document.getElementById('statEmployeeCard').classList.remove('hidden');
                cartBtn.classList.add('hidden');
            } else if (data.role === 'waiter') {
                // Waiter sees: Menu, Tables, Orders
                if (ordersMenuBtn) ordersMenuBtn.classList.remove('hidden');
                employeesBtn.classList.add('hidden');
                cartBtn.classList.add('hidden');
            } else if (data.role === 'user') {
                // User sees: Menu, Tables, My Order (корзина)
                if (ordersMenuBtn) ordersMenuBtn.classList.add('hidden');
                employeesBtn.classList.add('hidden');
                cartBtn.classList.remove('hidden');
            }

            // Load initial data
            loadMenuItems();
            loadTables();
            
            if (data.role !== 'user') {
                loadOrders();
            }
            
            if (data.role === 'admin') {
                loadEmployees();
            }

            console.log('✅ Успешный вход:', data);
        } else {
            // Register
            if (!fullName || !role) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    full_name: fullName,
                    role: role
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert('❌ Ошибка регистрации: ' + (errorData.detail || 'Такой логин уже существует'));
                return;
            }

            alert('✅ Аккаунт успешно создан! Теперь войдите.');
            toggleAuthMode(); // Switch to login mode
            console.log('✅ Регистрация успешна');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

function handleLogout() {
    currentUser = null;
    cart = [];
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    document.getElementById('authForm').reset();
    isLoginMode = true;
    document.querySelector('.auth-card h2').textContent = '🔐 Вход';
    document.getElementById('roleGroup').classList.add('hidden');
    document.getElementById('doLogin').textContent = '🔐 Вход';
}

function handleTabSwitch(btn) {
    menuBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const tabName = btn.getAttribute('data-tab');
    document.querySelectorAll('.tabpane').forEach(tab => {
        tab.classList.add('hidden');
    });
    document.getElementById(tabName).classList.remove('hidden');
    currentTab = tabName;
    
    // Загружаем корзину когда открыта
    if (tabName === 'cartTab') {
        loadCart();
    }
}

// Menu items
async function loadMenuItems() {
    try {
        const response = await fetch(`${API_URL}/api/menu/`);
        const items = await response.json();
        allMenuItems = items; // Сохраняем все товары
        
        const menuContent = document.getElementById('menuContent');
        menuContent.innerHTML = '';
        
        if (items.length === 0) {
            menuContent.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Нет доступных пунктов меню</p>';
            return;
        }
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'item';
            
            let html = `
                <div class="name">${item.name}</div>
                <div class="desc">${item.description || 'Без описания'}</div>
                <div class="meta">₽${item.price.toFixed(2)}</div>
                <small style="color: #999; display: block; margin-bottom: 10px;">${item.category}</small>
            `;
            
            if (currentUser && currentUser.role === 'user') {
                // безопасно передаем только ID
                html += `
                    <button
                        class="btn btn-primary"
                        style="font-size: 12px; padding: 8px;"
                        data-item-id="${item.id}"
                        onclick="addToCartById(this.dataset.itemId)"
                    >
                        📋 Добавить в мой заказ
                    </button>
                `;
            }
            
            itemEl.innerHTML = html;
            menuContent.appendChild(itemEl);
        });
        
        document.getElementById('statOrders').textContent = items.length;
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuContent').innerHTML = '<p style="color: red;">❌ Ошибка загрузки меню</p>';
    }
}

// Добавляем функцию, которая по ID берёт товар из allMenuItems
function addToCartById(itemId) {
    const id = parseInt(itemId, 10);
    const menuItem = allMenuItems.find(item => item.id === id);

    if (!menuItem) {
        alert('❌ Товар не найден');
        console.error('Item not found in allMenuItems, id =', id, allMenuItems);
        return;
    }

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
        });
    }

    updateCartBadge();
    alert(`✅ "${menuItem.name}" добавлено в мой заказ!`);
}

// Tables
async function loadTables() {
    try {
        const response = await fetch(`${API_URL}/api/tables/`);
        const tables = await response.json();
        
        const tablesGrid = document.getElementById('tablesGrid');
        tablesGrid.innerHTML = '';
        
        if (tables.length === 0) {
            tablesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Нет столов</p>';
            return;
        }
        
        let occupied = 0;
        tables.forEach(table => {
            if (table.is_occupied) occupied++;
            
            const tableEl = document.createElement('div');
            tableEl.className = 'item';
            tableEl.style.borderTop = table.is_occupied ? '4px solid #e74c3c' : '4px solid #2ecc71';
            tableEl.innerHTML = `
                <div class="name">Стол №${table.table_number}</div>
                <div class="desc">Мест: ${table.seats}</div>
                <div class="meta" style="color: ${table.is_occupied ? '#e74c3c' : '#2ecc71'};">
                    ${table.is_occupied ? '🔴 Занят' : '🟢 Свободен'}
                </div>
            `;
            tablesGrid.appendChild(tableEl);
        });
        
        document.getElementById('statTables').textContent = occupied;
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

// Orders
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/api/orders/`);
        const orders = await response.json();
        
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p style="text-align: center; color: #999;">Нет заказов</p>';
            return;
        }
        
        let active = 0;
        orders.forEach(order => {
            if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready') {
                active++;
            }
            
            const orderEl = document.createElement('div');
            orderEl.className = 'order';
            orderEl.innerHTML = `
                <div class="name">Заказ #${order.id} - Стол №${order.table_id}</div>
                <div class="meta">Статус: <strong>${getStatusText(order.status)}</strong></div>
                <div class="meta">Сумма: ₽${order.total_price.toFixed(2)}</div>
            `;
            orderEl.addEventListener('click', () => showOrderDetails(order));
            ordersList.appendChild(orderEl);
        });
        
        document.getElementById('statActive').textContent = active;
        document.getElementById('statOrders').textContent = orders.length;
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// остальной код (loadCart, updateCartBadge, createOrder, employees и т.д.) ОСТАВЛЕН БЕЗ ИЗМЕНЕНИЙ
