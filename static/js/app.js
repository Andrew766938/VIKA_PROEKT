const API_URL = window.location.origin;

// Global state
let currentUser = null;
let currentTab = 'menuTab';
let isLoginMode = true;
let cart = [];
let allMenuItems = [];
let editingEmployeeId = null;
let waiterNotifications = []; // Notifications for waiter

// Elements
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loginBtn = document.getElementById('doLogin');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const menuBtns = document.querySelectorAll('.menu-btn');

loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
menuBtns.forEach(btn => {
    btn.addEventListener('click', (e) => handleTabSwitch(e.target));
});

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const form = document.getElementById('authForm');
    const title = document.querySelector('.auth-card h2');
    const nameGroup = document.getElementById('nameGroup');
    const roleGroup = document.getElementById('roleGroup');
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const submitBtn = document.getElementById('doLogin');
    
    if (isLoginMode) {
        title.textContent = '🔐 Вход';
        nameGroup.classList.add('hidden');
        roleGroup.classList.add('hidden');
        toggleBtn.textContent = 'Создать аккаунт';
        submitBtn.textContent = '🔐 Вход';
        document.getElementById('loginUser').placeholder = 'Введите логин';
    } else {
        title.textContent = '📝 Регистрация';
        nameGroup.classList.remove('hidden');
        roleGroup.classList.remove('hidden');
        toggleBtn.textContent = 'Уже есть аккаунт? Войти';
        submitBtn.textContent = '✅ Зарегистрироваться';
        document.getElementById('loginUser').placeholder = 'Выберите логин';
    }
    form.reset();
}

async function handleLogin() {
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    const fullName = document.getElementById('loginName')?.value;
    const role = document.getElementById('loginRole')?.value;

    if (!username || !password) {
        alert('❌ Пожалуйста, заполните все поля');
        return;
    }

    // 🔒 ВАЛИДАЦИЯ ПАРОЛЯ - МИНИМУМ 6 СИМВОЛОВ
    if (password.length < 6) {
        alert('🔒 Ошибка: Пароль должен содержать минимум 6 символов!');
        return;
    }

    try {
        if (isLoginMode) {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert('❌ Ошибка входа: ' + (errorData.detail || 'Проверьте логин и пароль'));
                return;
            }

            const data = await response.json();
            currentUser = data;
            cart = [];
            waiterNotifications = [];

            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');

            document.getElementById('userName').textContent = data.full_name;
            document.getElementById('userRole').textContent = getRoleText(data.role);

            const menuBtn = document.getElementById('menuBtn');
            const ordersMenuBtn = document.getElementById('ordersMenuBtn');
            const cartBtn = document.getElementById('cartMenuBtn');
            const tablesStatusBtn = document.getElementById('tablesStatusBtn');
            const employeesBtn = document.getElementById('employeesMenuBtn');
            const tablesManageBtn = document.getElementById('tablesManageBtn');
            const menuManageBtn = document.getElementById('menuManageBtn');
            
            console.log('👤 Пользователь вошёл:', data.role);
            
            if (data.role === 'admin') {
                console.log('👨‍💼 АДМИН вошёл');
                if (menuBtn) menuBtn.classList.add('hidden');
                if (ordersMenuBtn) ordersMenuBtn.classList.add('hidden');
                if (tablesStatusBtn) tablesStatusBtn.classList.add('hidden');
                if (employeesBtn) employeesBtn.classList.add('hidden');
                if (tablesManageBtn) tablesManageBtn.classList.remove('hidden');
                if (menuManageBtn) menuManageBtn.classList.remove('hidden');
                document.getElementById('statEmployeeCard').classList.add('hidden');
                cartBtn.classList.add('hidden');
                
                handleTabSwitch(tablesManageBtn);
            } else if (data.role === 'chef') {
                console.log('👨‍🍳 ПОВАР вошёл');
                if (menuBtn) menuBtn.classList.remove('hidden');
                if (ordersMenuBtn) ordersMenuBtn.classList.remove('hidden');
                if (tablesStatusBtn) tablesStatusBtn.classList.add('hidden');
                if (employeesBtn) employeesBtn.classList.add('hidden');
                if (tablesManageBtn) tablesManageBtn.classList.add('hidden');
                if (menuManageBtn) menuManageBtn.classList.add('hidden');
                cartBtn.classList.add('hidden');
                
                handleTabSwitch(ordersMenuBtn);
            } else if (data.role === 'waiter') {
                console.log('🧑‍💼 ОФИЦИАНТ вошёл');
                if (menuBtn) menuBtn.classList.remove('hidden');
                if (ordersMenuBtn) ordersMenuBtn.classList.add('hidden');
                if (tablesStatusBtn) tablesStatusBtn.classList.remove('hidden');
                if (employeesBtn) employeesBtn.classList.add('hidden');
                if (tablesManageBtn) tablesManageBtn.classList.add('hidden');
                if (menuManageBtn) menuManageBtn.classList.add('hidden');
                cartBtn.classList.remove('hidden');
            }

            loadMenuItems();
            
            if (data.role === 'chef') {
                loadOrders();
                // Auto-refresh orders every 2 seconds for chef
                setInterval(() => {
                    if (currentUser && currentUser.role === 'chef') {
                        loadOrders();
                    }
                }, 2000);
            }
            
            if (data.role === 'waiter') {
                // Auto-refresh notifications every 3 seconds for waiter
                setInterval(() => {
                    if (currentUser && currentUser.role === 'waiter') {
                        loadTablesForStatus();
                        checkForReadyOrders();
                    }
                }, 3000);
            }
            
            if (data.role === 'admin') {
                loadTablesForManagement();
                loadMenuForManagement();
            }

            console.log('✅ Успешный вход:', data);
        } else {
            if (!fullName || !role) {
                alert('❌ Пожалуйста, заполните все поля');
                return;
            }

            // 🔒 ВАЛИДАЦИЯ ПАРОЛЯ - МИНИМУМ 6 СИМВОЛОВ (при регистрации)
            if (password.length < 6) {
                alert('🔒 Ошибка: Пароль должен содержать минимум 6 символов!');
                return;
            }

            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, full_name: fullName, role })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert('❌ Ошибка регистрации: ' + (errorData.detail || 'Такой логин уже существует'));
                return;
            }

            alert('✅ Аккаунт успешно создан!\n\nТеперь войдите.');
            toggleAuthMode();
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
    waiterNotifications = [];
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    document.getElementById('authForm').reset();
    isLoginMode = true;
    document.querySelector('.auth-card h2').textContent = '🔐 Вход';
    document.getElementById('nameGroup').classList.add('hidden');
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
    
    if (tabName === 'cartTab') {
        loadCart();
    } else if (tabName === 'employeesTab') {
        loadEmployees();
    } else if (tabName === 'tablesManageTab') {
        loadTablesForManagement();
    } else if (tabName === 'tablesStatusTab') {
        loadTablesForStatus();
    } else if (tabName === 'menuManageTab') {
        loadMenuForManagement();
    }
}

// Check for ready orders and notify waiter
async function checkForReadyOrders() {
    try {
        const response = await fetch(`${API_URL}/api/orders/`);
        const orders = await response.json();
        
        orders.forEach(order => {
            if (order.status === 'ready') {
                // Check if we already notified about this order
                if (!waiterNotifications.includes(order.id)) {
                    waiterNotifications.push(order.id);
                    showWaiterNotification(`🍽️ Заказ #${order.id} готов! (Стол №${order.table_id})`, order.id);
                }
            }
        });
    } catch (error) {
        console.error('Ошибка проверки готовых заказов:', error);
    }
}

// Show notification for waiter
function showWaiterNotification(message, orderId) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: rgba(255,255,255,0.3);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        margin-left: 15px;
        padding: 0 5px;
        border-radius: 4px;
    `;
    closeBtn.onclick = () => notification.remove();
    
    const completeBtn = document.createElement('button');
    completeBtn.innerHTML = '✅ Ок';
    completeBtn.style.cssText = `
        background: rgba(255,255,255,0.3);
        border: none;
        color: white;
        padding: 8px 15px;
        margin-left: 10px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    completeBtn.onclick = () => {
        completeOrder(orderId);
        notification.remove();
    };
    
    notification.innerHTML = message;
    notification.appendChild(completeBtn);
    notification.appendChild(closeBtn);
    document.body.appendChild(notification);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 8000);
}

// Complete order from notification
async function completeOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });
        
        if (response.ok) {
            alert('✅ Заказ завершен!');
            loadTablesForStatus();
            // Remove from notifications
            waiterNotifications = waiterNotifications.filter(id => id !== orderId);
        }
    } catch (error) {
        console.error('Ошибка завершения заказа:', error);
    }
}

// WAITER: Table Status Management with 3D Flip Animation
async function loadTablesForStatus() {
    try {
        const response = await fetch(`${API_URL}/api/tables/`);
        const tables = await response.json();
        
        const tablesStatusContent = document.getElementById('tablesStatusContent');
        tablesStatusContent.innerHTML = '';
        
        if (tables.length === 0) {
            tablesStatusContent.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">Нет столов</p>';
            return;
        }
        
        tables.forEach(table => {
            const container = document.createElement('div');
            container.className = 'table-card-container';
            
            const tableCard = document.createElement('div');
            tableCard.className = `table-card ${table.is_occupied ? 'occupied' : 'free'}`;
            tableCard.setAttribute('data-table-id', table.id);
            
            // Front side
            const frontFace = document.createElement('div');
            frontFace.className = 'table-card-front';
            frontFace.innerHTML = `
                <div class="number">#${table.table_number}</div>
                <div class="seats">${table.seats} мест</div>
                <button class="btn ${table.is_occupied ? 'btn-success' : 'btn-danger'}" 
                        style="width: 100%; font-size: 13px; padding: 8px;" 
                        onclick="toggleTableStatus(${table.id}, ${!table.is_occupied})">
                    ${table.is_occupied ? '🟢 Освободить' : '🔴 Занять'}
                </button>
            `;
            
            // Back side
            const backFace = document.createElement('div');
            backFace.className = 'table-card-back';
            backFace.innerHTML = `
                <div class="number">#${table.table_number}</div>
                <div class="seats">${table.seats} мест</div>
                <button class="btn" 
                        style="width: 100%; font-size: 13px; padding: 8px;" 
                        onclick="toggleTableStatus(${table.id}, ${!table.is_occupied})">
                    ${table.is_occupied ? '🟢 Освободить' : '🔴 Занять'}
                </button>
            `;
            
            tableCard.appendChild(frontFace);
            tableCard.appendChild(backFace);
            container.appendChild(tableCard);
            tablesStatusContent.appendChild(container);
        });
    } catch (error) {
        console.error('Ошибка загрузки столов:', error);
    }
}

async function toggleTableStatus(tableId, isOccupied) {
    try {
        // Find the card element
        const card = document.querySelector(`[data-table-id="${tableId}"]`);
        
        if (card) {
            // Add flip animation
            card.classList.add('flipping');
            
            // Wait for animation to reach halfway (300ms of 600ms)
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const response = await fetch(`${API_URL}/api/tables/${tableId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_occupied: isOccupied })
        });

        if (!response.ok) throw new Error('Ошибка обновления статуса стола');
        
        // Wait for the rest of animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Reload tables to show updated state
        loadTablesForStatus();
    } catch (error) {
        console.error('Ошибка изменения статуса стола:', error);
        alert('❌ Ошибка: ' + error.message);
        // Reload on error
        loadTablesForStatus();
    }
}

// Menu items
async function loadMenuItems() {
    try {
        const response = await fetch(`${API_URL}/api/menu/`);
        const items = await response.json();
        allMenuItems = items;
        
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
            
            if (currentUser && currentUser.role === 'waiter') {
                html += `
                    <button
                        class="btn btn-primary"
                        style="font-size: 12px; padding: 8px;"
                        data-item-id="${item.id}"
                        onclick="addToCartById(this.dataset.itemId)"
                    >
                        📋 Добавить в заказ
                    </button>
                `;
            }
            
            itemEl.innerHTML = html;
            menuContent.appendChild(itemEl);
        });
        
        document.getElementById('statOrders').textContent = items.length;
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
        document.getElementById('menuContent').innerHTML = '<p style="color: red;">❌ Ошибка загуки меню</p>';
    }
}

// ADMIN: Menu Management with Event Delegation
async function loadMenuForManagement() {
    try {
        const response = await fetch(`${API_URL}/api/menu/`);
        const items = await response.json();
        
        const menuManageContent = document.getElementById('menuManageContent');
        menuManageContent.innerHTML = '';
        
        if (items.length === 0) {
            menuManageContent.innerHTML = '<p style="text-align: center; color: #999;">Нет блюд в меню</p>';
        } else {
            items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                itemEl.setAttribute('data-menu-item-id', item.id);
                
                itemEl.innerHTML = `
                    <div class="name">${item.name}</div>
                    <div class="desc">${item.description || 'Без описания'}</div>
                    <div class="meta">₽${item.price.toFixed(2)}</div>
                    <small style="color: #999; display: block; margin-bottom: 10px;">${item.category}</small>
                    <button class="btn btn-danger delete-menu-btn" style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;" data-menu-id="${item.id}">🗑️ Удалить</button>
                `;
                menuManageContent.appendChild(itemEl);
            });
        }
        console.log('✅ Меню для управления загружено:', items.length, 'блюд');
    } catch (error) {
        console.error('Ошибка загрузки меню для управления:', error);
    }
}

// Event delegation for menu delete buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-menu-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const menuId = e.target.getAttribute('data-menu-id');
        console.log('🗑️ Нажата кнопка удаления блюда ID:', menuId);
        deleteMenuItem(menuId);
    }
});

// Event delegation for table delete buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-table-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const tableId = e.target.getAttribute('data-table-id');
        console.log('🗑️ Нажата кнопка удаления стола ID:', tableId);
        deleteTable(tableId);
    }
});

function openAddMenuItemModal() {
    document.getElementById('addMenuItemForm').reset();
    document.getElementById('addMenuItemModal').classList.remove('hidden');
}

function closeAddMenuItemModal() {
    document.getElementById('addMenuItemModal').classList.add('hidden');
}

async function saveMenuItem() {
    const name = document.getElementById('itemName').value;
    const description = document.getElementById('itemDescription').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const category = document.getElementById('itemCategory').value;
    
    if (!name || !price || !category) {
        alert('❌ Пожалуйста, заполните обязательные поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/menu/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                description: description,
                price: price,
                category: category
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert('❌ Ошибка: ' + (errorData.detail || 'Неизвестная ошибка'));
            return;
        }

        const item = await response.json();
        alert(`✅ Блюдо "${item.name}" добавлено в меню`);
        closeAddMenuItemModal();
        loadMenuForManagement();
        loadMenuItems();
    } catch (error) {
        console.error('Ошибка сохранения блюда:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

async function deleteMenuItem(itemId) {
    if (!confirm('⚠️ Уверены? Это действие невозможно отменить.')) return;
    
    const id = parseInt(itemId, 10);
    console.log('🗑️ Начало удаления блюда ID:', id);
    
    try {
        const response = await fetch(`${API_URL}/api/menu/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('📦 Ответ сервера:', response.status, response.statusText);

        if (!response.ok) {
            let errorMessage = 'Ошибка удаления';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            console.error('❌ Ошибка сервера:', errorMessage);
            alert('❌ Ошибка сервера: ' + errorMessage);
            return;
        }
        
        const itemElement = document.querySelector(`[data-menu-item-id="${id}"]`);
        if (itemElement) {
            itemElement.style.transition = 'opacity 0.3s';
            itemElement.style.opacity = '0';
            setTimeout(() => {
                if (itemElement.parentElement) {
                    itemElement.remove();
                }
            }, 300);
        }
        
        console.log('✅ Блюдо удалено успешно');
        alert('✅ Блюдо удалено из меню');
        loadMenuItems();
    } catch (error) {
        console.error('Ошибка удаления блюда:', error);
        alert('❌ Ошибка сети: ' + error.message);
        loadMenuForManagement();
    }
}

function addToCartById(itemId) {
    const id = parseInt(itemId, 10);
    const menuItem = allMenuItems.find(item => item.id === id);

    if (!menuItem) {
        alert('❌ Товар не найден');
        return;
    }

    console.log('📋 ОФИЦИАНТ добавляет блюдо в заказ:', menuItem.name);

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

    console.log('✅ Блюдо добавлено в корзину');
    updateCartBadge();
    alert(`✅ "${menuItem.name}" добавлено в заказ!`);
}

// ADMIN: Table Management with Event Delegation
async function loadTablesForManagement() {
    try {
        const response = await fetch(`${API_URL}/api/tables/`);
        const tables = await response.json();
        
        const tablesManageContent = document.getElementById('tablesManageContent');
        tablesManageContent.innerHTML = '';
        
        if (tables.length === 0) {
            tablesManageContent.innerHTML = '<p style="text-align: center; color: #999;">Нет столов</p>';
        } else {
            tables.forEach(table => {
                const tableEl = document.createElement('div');
                tableEl.className = 'item';
                tableEl.setAttribute('data-table-id', table.id);
                tableEl.style.borderTop = table.is_occupied ? '4px solid #e74c3c' : '4px solid #2ecc71';
                
                tableEl.innerHTML = `
                    <div class="name">Стол №${table.table_number}</div>
                    <div class="desc">Мест: ${table.seats}</div>
                    <div class="meta" style="color: ${table.is_occupied ? '#e74c3c' : '#2ecc71'};">${table.is_occupied ? '🔴 Занят' : '🟢 Свободен'}</div>
                    <button class="btn btn-danger delete-table-btn" style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;" data-table-id="${table.id}">🗑️ Удалить</button>
                `;
                tablesManageContent.appendChild(tableEl);
            });
        }
        console.log('✅ Столы для управления загружены:', tables.length, 'столов');
    } catch (error) {
        console.error('Ошибка загрузки столов:', error);
    }
}

function openAddTableModal() {
    document.getElementById('addTableForm').reset();
    document.getElementById('addTableModal').classList.remove('hidden');
}

function closeAddTableModal() {
    document.getElementById('addTableModal').classList.add('hidden');
}

async function saveTable() {
    const tableNumber = parseInt(document.getElementById('tableNumber').value);
    const seats = parseInt(document.getElementById('tableSeats').value);
    
    if (!tableNumber || !seats || seats < 1) {
        alert('❌ Пожалуйста, введите корректные данные');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/tables/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table_number: tableNumber,
                seats: seats
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert('❌ Ошибка: ' + (errorData.detail || 'Неизвестная ошибка'));
            return;
        }

        const table = await response.json();
        alert(`✅ Стол №${table.table_number} добавлен`);
        closeAddTableModal();
        loadTablesForManagement();
    } catch (error) {
        console.error('Ошибка сохранения стола:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

async function deleteTable(tableId) {
    if (!confirm('⚠️ Уверены? Это действие невозможно отменить.')) return;
    
    const id = parseInt(tableId, 10);
    console.log('🗑️ Начало удаления стола ID:', id);
    
    try {
        const response = await fetch(`${API_URL}/api/tables/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('📦 Ответ сервера:', response.status, response.statusText);

        if (!response.ok) {
            let errorMessage = 'Ошибка удаления';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            console.error('❌ Ошибка сервера:', errorMessage);
            alert('❌ Ошибка сервера: ' + errorMessage);
            return;
        }
        
        const tableElement = document.querySelector(`[data-table-id="${id}"]`);
        if (tableElement) {
            tableElement.style.transition = 'opacity 0.3s';
            tableElement.style.opacity = '0';
            setTimeout(() => {
                if (tableElement.parentElement) {
                    tableElement.remove();
                }
            }, 300);
        }
        
        console.log('✅ Стол удалён успешно');
        alert('✅ Стол удален');
    } catch (error) {
        console.error('Ошибка удаления стола:', error);
        alert('❌ Ошибка сети: ' + error.message);
    }
}

// Employees
async function loadEmployees() {
    try {
        console.log('🔄 Загрузка сотрудников...');
        const response = await fetch(`${API_URL}/api/employees/`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загузки сотрудников: ${response.status}`);
        }
        
        const employees = await response.json();
        console.log('✅ Сотрудники загружены:', employees);
        
        const tableBody = document.getElementById('employeesTableBody');
        tableBody.innerHTML = '';
        
        if (employees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Нет сотрудников</td></tr>';
            return;
        }
        
        employees.forEach(emp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.id}</td>
                <td>${emp.username}</td>
                <td>${emp.full_name}</td>
                <td><span class="role-badge ${emp.role}">${getRoleText(emp.role)}</span></td>
                <td>
                    <div class="employee-actions">
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="deleteEmployee(${emp.id})">🗑️ Удалить</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.getElementById('statEmployees').textContent = employees.length;
    } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error);
        alert('❌ Ошибка при загрузке сотрудников: ' + error.message);
    }
}

function addEmployeeModal() {
    alert('❌ Добавление сотрудников недоступно');
}

function editEmployee(id, username, fullName, role) {
    alert('❌ Редактирование сотрудников недоступно');
}

async function deleteEmployee(id) {
    if (!confirm('⚠️ Вы уверены, что хотите удалить сотрудника?')) {
        return;
    }
    
    try {
        console.log('🗑️ Удаление сотрудника:', id);
        const response = await fetch(`${API_URL}/api/employees/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert('❌ Ошибка при удалении: ' + (errorData.detail || 'Неизвестная ошибка'));
            return;
        }

        alert('✅ Сотрудник успешно удален');
        loadEmployees();
    } catch (error) {
        console.error('Ошибка удаления сотрудника:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

function closeEmployeeModal() {
    console.log('❌ Закрытие модального окна');
    document.getElementById('employeeModal').classList.add('hidden');
    editingEmployeeId = null;
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
}

async function saveEmployee() {
    alert('❌ Сохранение сотрудников недоступно');
}

// CART
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = count;
        if (count === 0) {
            badge.classList.add('hidden');
        } else {
            badge.classList.remove('hidden');
        }
    }
}

function loadCart() {
    const cartContent = document.getElementById('cartContent');
    
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p>📝 Ваш заказ пусто</p>
                <p>Добавьте блюда из меню</p>
            </div>
        `;
        return;
    }
    
    let total = 0;
    let html = '<div class="cart-items">';
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <div style="flex: 1;">
                    <strong>${item.name}</strong>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">
                        ₽${item.price} x ${item.quantity} = ₽${itemTotal.toFixed(2)}
                    </p>
                </div>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <button class="btn btn-secondary" style="width: 30px; height: 30px; padding: 0;" onclick="changeQuantity(${index}, -1)">-</button>
                    <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="btn btn-secondary" style="width: 30px; height: 30px; padding: 0;" onclick="changeQuantity(${index}, 1)">+</button>
                    <button class="btn btn-danger" style="width: 40px; height: 30px; padding: 0; margin-left: 10px;" onclick="removeFromCart(${index})">×</button>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    html += `
        <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                <span>Итого:</span>
                <span>₽${total.toFixed(2)}</span>
            </div>
            <div class="form-group">
                <label>Выберите стол</label>
                <select id="orderTableSelect">
                    <option value="">Выберите стол</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="createOrder()">📋 Оформить заказ</button>
        </div>
    `;
    
    cartContent.innerHTML = html;
    loadTablesForOrder();
}

async function loadTablesForOrder() {
    try {
        const response = await fetch(`${API_URL}/api/tables/`);
        const tables = await response.json();
        const select = document.getElementById('orderTableSelect');
        
        if (!select) return;
        
        tables.forEach(table => {
            if (!table.is_occupied) {
                const option = document.createElement('option');
                option.value = table.id;
                option.textContent = `Стол №${table.table_number} (${table.seats} мест)`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки столов:', error);
    }
}

function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        loadCart();
        updateCartBadge();
    }
}

function removeFromCart(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    alert(`"${itemName}" удален из заказа`);
    loadCart();
    updateCartBadge();
}

async function createOrder() {
    const tableSelect = document.getElementById('orderTableSelect');
    const tableId = tableSelect.value;
    
    if (!tableId) {
        alert('⚠️ Пожалуйста, выберите свободный стол!');
        return;
    }
    
    if (cart.length === 0) {
        alert('❌ Заказ пусто');
        return;
    }
    
    try {
        const orderData = {
            table_id: parseInt(tableId),
            items: cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity
            }))
        };
        
        const response = await fetch(`${API_URL}/api/orders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert('❌ Ошибка при создании заказа: ' + (errorData.detail || 'Неизвестная ошибка'));
            return;
        }

        const order = await response.json();
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        alert(`✅ Заказ #${order.id} оформлен!\n\n${tableSelect.options[tableSelect.selectedIndex].text}\nСумма: ₽${totalPrice.toFixed(2)}\n\nВаш заказ принят.`);
        
        cart = [];
        updateCartBadge();
        loadCart();
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

// CHEF: Orders Management
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
            
            const container = document.createElement('div');
            container.className = 'order-container';
            
            const orderEl = document.createElement('div');
            orderEl.className = 'order';
            orderEl.setAttribute('data-order-id', order.id);
            
            // Front side
            const frontFace = document.createElement('div');
            frontFace.className = 'order-front';
            let frontHtml = `
                <div class="name">Заказ #${order.id} - Стол №${order.table_id}</div>
                <div class="meta">Статус: <strong>${getStatusText(order.status)}</strong></div>
                <div class="meta">Сумма: ₽${order.total_price.toFixed(2)}</div>
            `;
            
            if (currentUser && (currentUser.role === 'chef' || currentUser.role === 'admin')) {
                // ONLY SHOW "MARK READY" BUTTON for pending/confirmed - NOT for ready/completed
                if (order.status === 'pending' || order.status === 'confirmed') {
                    const readyBtn = document.createElement('button');
                    readyBtn.className = 'btn btn-primary order-ready-btn';
                    readyBtn.style.cssText = 'flex: 1; font-size: 12px; padding: 8px; margin-right: 8px;';
                    readyBtn.setAttribute('data-order-id', order.id);
                    readyBtn.innerHTML = '🟢 Заказ готов';
                    readyBtn.onclick = (e) => {
                        e.stopPropagation();
                        markOrderReady(order.id);
                    };
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-danger order-delete-btn';
                    deleteBtn.style.cssText = 'width: 40px; font-size: 12px; padding: 8px;';
                    deleteBtn.setAttribute('data-order-id', order.id);
                    deleteBtn.innerHTML = '🗑️';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteOrder(order.id);
                    };
                    
                    const btnContainer = document.createElement('div');
                    btnContainer.style.display = 'flex';
                    btnContainer.style.gap = '8px';
                    btnContainer.style.marginTop = '10px';
                    btnContainer.appendChild(readyBtn);
                    btnContainer.appendChild(deleteBtn);
                    
                    frontFace.innerHTML = frontHtml;
                    frontFace.appendChild(btnContainer);
                }
                // Show delete button for other statuses
                else {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-danger order-delete-btn';
                    deleteBtn.style.cssText = 'width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;';
                    deleteBtn.setAttribute('data-order-id', order.id);
                    deleteBtn.innerHTML = '🗑️ Удалить заказ';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteOrder(order.id);
                    };
                    
                    frontFace.innerHTML = frontHtml;
                    frontFace.appendChild(deleteBtn);
                }
            } else {
                frontFace.innerHTML = frontHtml;
            }
            
            // Back side (green success state)
            const backFace = document.createElement('div');
            backFace.className = 'order-back';
            backFace.innerHTML = `
                <div class="name">✅ Заказ #${order.id} готов!</div>
                <div class="meta">Стол №${order.table_id}</div>
                <div class="meta">Сумма: ₽${order.total_price.toFixed(2)}</div>
                <div style="margin-top: 10px; font-size: 18px; font-weight: bold;">🍽️ Можно подавать!</div>
            `;
            
            orderEl.appendChild(frontFace);
            orderEl.appendChild(backFace);
            
            // Add click to view details (only on front, not on buttons)
            frontFace.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    showOrderDetails(order);
                }
            });
            
            container.appendChild(orderEl);
            ordersList.appendChild(container);
        });
        
        document.getElementById('statActive').textContent = active;
        document.getElementById('statOrders').textContent = orders.length;
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
}

async function markOrderReady(orderId) {
    try {
        // Find the order element
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        
        if (orderCard) {
            // Add flip animation
            orderCard.classList.add('flipping');
            
            // Wait for animation to reach halfway (500ms of 1000ms)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ready' })
        });

        if (!response.ok) {
            throw new Error('Ошибка при обновлении статуса заказа');
        }

        // Wait for the rest of animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        alert('✅ Заказ отмечен как готовый!');
        loadOrders();
    } catch (error) {
        console.error('Ошибка обновления заказа:', error);
        alert('❌ Ошибка: ' + error.message);
        loadOrders();
    }
}

async function deleteOrder(orderId) {
    if (!confirm('⚠️ Удалить этот заказ?')) return;
    
    const id = parseInt(orderId, 10);
    
    try {
        console.log('🗑️ ПОВАР удаляет заказ ID:', id);
        
        const response = await fetch(`${API_URL}/api/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('📦 Ответ сервера:', response.status, response.statusText);

        if (!response.ok) {
            let errorMessage = 'Ошибка при удалении заказа';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            console.error('❌ Ошибка сервера:', errorMessage);
            alert('❌ Ошибка сервера: ' + errorMessage);
            return;
        }
        
        // Remove order from DOM immediately
        const orderElement = document.querySelector(`[data-order-id="${id}"]`)?.closest('.order-container');
        if (orderElement) {
            orderElement.style.transition = 'opacity 0.3s';
            orderElement.style.opacity = '0';
            setTimeout(() => {
                if (orderElement.parentElement) {
                    orderElement.remove();
                }
            }, 300);
        }
        
        console.log('✅ Заказ удалён успешно');
        alert('✅ Заказ удален');
    } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        alert('❌ Ошибка сети: ' + error.message);
        loadOrders();
    }
}

function showOrderDetails(order) {
    let itemsHtml = '<div style="margin-top: 10px;">';
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            itemsHtml += `
                <div style="padding: 8px; background: #f9f9f9; margin-bottom: 8px; border-radius: 4px;">
                    <strong>${item.name || 'Товар'}</strong><br>
                    Кол-во: ${item.quantity} × ₽${item.price.toFixed(2)}
                </div>
            `;
        });
    } else {
        itemsHtml += '<p style="color: #999;">Нет товаров в заказе</p>';
    }
    itemsHtml += '</div>';

    document.getElementById('orderDetails').innerHTML = `
        <div style="margin-bottom: 15px;">
            <h4>Заказ #${order.id}</h4>
            <p><strong>Стол:</strong> №${order.table_id}</p>
            <p><strong>Статус:</strong> ${getStatusText(order.status)}</p>
            <p><strong>Сумма:</strong> ₽${order.total_price.toFixed(2)}</p>
        </div>
        <h4>Товары:</h4>
        ${itemsHtml}
    `;
    
    document.getElementById('orderModal').classList.remove('hidden');
}

function getStatusText(status) {
    const statuses = {
        'pending': '⏳ Ожидание',
        'confirmed': '✅ Подтвержден',
        'ready': '🟢 Готово',
        'completed': '✔️ Завершен',
        'cancelled': '❌ Отменен'
    };
    return statuses[status] || status;
}

function getRoleText(role) {
    const roles = {
        'chef': '👨‍🍳 Повар',
        'waiter': '🧑‍💼 Официант',
        'admin': '👨‍💼 Администратор'
    };
    return roles[role] || role;
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App initialized - Система готова!');
    console.log('🔐 Введите свои учётные данные для входа');
});
