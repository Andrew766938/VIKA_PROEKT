const API_URL = window.location.origin;

// Global state
let currentUser = null;
let currentTab = 'menuTab';
let isLoginMode = true;
let cart = [];
let allMenuItems = [];
let editingEmployeeId = null;

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

            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');

            document.getElementById('userName').textContent = data.full_name;
            document.getElementById('userRole').textContent = getRoleText(data.role);

            const ordersMenuBtn = document.getElementById('ordersMenuBtn');
            const cartBtn = document.getElementById('cartMenuBtn');
            const tablesStatusBtn = document.getElementById('tablesStatusBtn');
            const employeesBtn = document.getElementById('employeesMenuBtn');
            const tablesManageBtn = document.getElementById('tablesManageBtn');
            const menuManageBtn = document.getElementById('menuManageBtn');
            
            if (data.role === 'admin') {
                if (ordersMenuBtn) ordersMenuBtn.classList.add('hidden');
                if (tablesStatusBtn) tablesStatusBtn.classList.add('hidden');
                if (tablesManageBtn) tablesManageBtn.classList.remove('hidden');
                if (menuManageBtn) menuManageBtn.classList.remove('hidden');
                employeesBtn.classList.remove('hidden');
                document.getElementById('statEmployeeCard').classList.remove('hidden');
                cartBtn.classList.add('hidden');
            } else if (data.role === 'chef') {
                if (ordersMenuBtn) ordersMenuBtn.classList.remove('hidden');
                if (tablesStatusBtn) tablesStatusBtn.classList.add('hidden');
                if (tablesManageBtn) tablesManageBtn.classList.add('hidden');
                if (menuManageBtn) menuManageBtn.classList.add('hidden');
                employeesBtn.classList.add('hidden');
                cartBtn.classList.add('hidden');
            } else if (data.role === 'waiter') {
                if (ordersMenuBtn) ordersMenuBtn.classList.add('hidden');
                if (tablesStatusBtn) tablesStatusBtn.classList.remove('hidden');
                if (tablesManageBtn) tablesManageBtn.classList.add('hidden');
                if (menuManageBtn) menuManageBtn.classList.add('hidden');
                employeesBtn.classList.add('hidden');
                cartBtn.classList.remove('hidden');
            }

            loadMenuItems();
            
            if (data.role === 'chef') {
                loadOrders();
            }
            
            if (data.role === 'admin') {
                loadEmployees();
            }

            console.log('✅ Успешный вход:', data);
        } else {
            if (!fullName || !role) {
                alert('❌ Пожалуйста, заполните все поля');
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

            alert('✅ Аккаунт успешно создан! Теперь войдите.');
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
    
    if (tabName === 'cartTab') {
        loadCart();
    } else if (tabName === 'employeesTab') {
        loadEmployees();
    } else if (tabName === 'tablesManageTab') {
        loadTablesForManagement();
    } else if (tabName === 'menuManageTab') {
        loadMenuForManagement();
    } else if (tabName === 'tablesStatusTab') {
        loadTablesForStatus();
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
        document.getElementById('menuContent').innerHTML = '<p style="color: red;">❌ Ошибка загрузки меню</p>';
    }
}

function addToCartById(itemId) {
    const id = parseInt(itemId, 10);
    const menuItem = allMenuItems.find(item => item.id === id);

    if (!menuItem) {
        alert('❌ Товар не найден');
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
    alert(`✅ "${menuItem.name}" добавлено в заказ!`);
}

// ADMIN: Menu Management
async function loadMenuForManagement() {
    try {
        const response = await fetch(`${API_URL}/api/menu/`);
        const items = await response.json();
        
        const menuManageContent = document.getElementById('menuManageContent');
        menuManageContent.innerHTML = '';
        
        if (items.length === 0) {
            menuManageContent.innerHTML = '<p style="text-align: center; color: #999;">Нет блюд</p>';
        } else {
            items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                itemEl.innerHTML = `
                    <div class="name">${item.name}</div>
                    <div class="desc">${item.description}</div>
                    <div class="meta">₽${item.price} | ${item.category}</div>
                    <button class="btn btn-danger" style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;" onclick="deleteMenuItem(${item.id})">🗑️ Удалить</button>
                `;
                menuManageContent.appendChild(itemEl);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
    }
}

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
                name,
                description: description || '',
                price,
                category
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert('❌ Ошибка: ' + (errorData.detail || 'Неизвестная ошибка'));
            return;
        }

        const item = await response.json();
        alert(`✅ Блюдо "${item.name}" добавлено`);
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
    
    try {
        const response = await fetch(`${API_URL}/api/menu/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Ошибка удаления');
        
        alert('✅ Блюдо удалено');
        loadMenuForManagement();
        loadMenuItems();
    } catch (error) {
        console.error('Ошибка удаления блюда:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

// ADMIN: Table Management
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
                tableEl.style.borderTop = table.is_occupied ? '4px solid #e74c3c' : '4px solid #2ecc71';
                tableEl.innerHTML = `
                    <div class="name">Стол №${table.table_number}</div>
                    <div class="desc">Мест: ${table.seats}</div>
                    <div class="meta" style="color: ${table.is_occupied ? '#e74c3c' : '#2ecc71'};">${table.is_occupied ? '🔴 Занят' : '🟢 Свободен'}</div>
                    <button class="btn btn-danger" style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;" onclick="deleteTable(${table.id})">🗑️ Удалить</button>
                `;
                tablesManageContent.appendChild(tableEl);
            });
        }
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
    
    try {
        const response = await fetch(`${API_URL}/api/tables/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Ошибка удаления');
        
        alert('✅ Стол удален');
        loadTablesForManagement();
    } catch (error) {
        console.error('Ошибка удаления стола:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

// Employees
async function loadEmployees() {
    try {
        console.log('🔄 Загрузка сотрудников...');
        const response = await fetch(`${API_URL}/api/employees/`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки сотрудников: ${response.status}`);
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
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="editEmployee(${emp.id}, '${emp.username}', '${emp.full_name}', '${emp.role}')">✏️ Изменить</button>
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
    if (!currentUser || currentUser.role !== 'admin') {
        alert('❌ Только администраторы могут добавлять сотрудников');
        return;
    }
    
    console.log('🔓 Открытие модального окна');
    editingEmployeeId = null;
    document.getElementById('modalTitle').textContent = 'Добавить сотрудника';
    document.getElementById('employeeForm').reset();
    document.getElementById('empPassword').parentElement.style.display = 'block';
    document.getElementById('employeeModal').classList.remove('hidden');
}

function editEmployee(id, username, fullName, role) {
    console.log('✏️ Редактирование сотрудника:', id);
    editingEmployeeId = id;
    document.getElementById('modalTitle').textContent = 'Редактировать сотрудника';
    document.getElementById('empUsername').value = username;
    document.getElementById('empName').value = fullName;
    document.getElementById('empRole').value = role;
    document.getElementById('empPassword').value = '';
    document.getElementById('empPassword').placeholder = 'Оставьте пустым, чтобы не менять';
    document.getElementById('empPassword').parentElement.style.display = 'block';
    document.getElementById('employeeModal').classList.remove('hidden');
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
    const username = document.getElementById('empUsername').value;
    const name = document.getElementById('empName').value;
    const password = document.getElementById('empPassword').value;
    const role = document.getElementById('empRole').value;

    console.log('📝 Сохранение сотрудника:', { username, name, role, isEdit: !!editingEmployeeId });

    if (!username || !name || !role) {
        alert('❌ Пожалуйста, заполните все обязательные поля');
        return;
    }

    if (!editingEmployeeId && !password) {
        alert('❌ Пожалуйста, введите пароль');
        return;
    }

    try {
        let url = `${API_URL}/api/employees/`;
        let method = 'POST';
        let employeeData = {};

        if (editingEmployeeId) {
            url = `${API_URL}/api/employees/${editingEmployeeId}`;
            method = 'PUT';
            employeeData = {
                full_name: name,
                password: password || undefined
            };
            Object.keys(employeeData).forEach(k => employeeData[k] === undefined && delete employeeData[k]);
        } else {
            employeeData = {
                username: username,
                full_name: name,
                password: password,
                role: role
            };
        }
        
        console.log('📤 Отправка данных:', employeeData);
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });

        console.log('📥 Ответ сервера:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.log('❌ Ошибка сервера:', errorData);
            alert('❌ Ошибка: ' + (errorData.detail || 'Неизвестная ошибка'));
            return;
        }

        const employee = await response.json();
        console.log('✅ Сотрудник сохранен:', employee);
        
        const action = editingEmployeeId ? 'обновлен' : 'создан';
        alert(`✅ Сотрудник "${employee.full_name}" (${getRoleText(employee.role)}) успешно ${action}!`);
        closeEmployeeModal();
        loadEmployees();
    } catch (error) {
        console.error('Ошибка сохранения сотрудника:', error);
        alert('❌ Ошибка при сохранении: ' + error.message);
    }
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
                <p>📝 Ваш заказ пуст</p>
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
        alert('❌ Заказ пуст');
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

// CHEF: Orders with 3D Flip Animation (SLOWER - 1000ms)
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
                // Show "Mark Ready" button only for pending/confirmed orders
                if (order.status === 'pending' || order.status === 'confirmed') {
                    frontHtml += `
                        <div style="display: flex; gap: 8px; margin-top: 10px;">
                            <button 
                                class="btn btn-primary" 
                                style="flex: 1; font-size: 12px; padding: 8px;"
                                onclick="markOrderReady(${order.id})"
                            >
                                🟢 Заказ готов
                            </button>
                            <button 
                                class="btn btn-danger" 
                                style="width: 40px; font-size: 12px; padding: 8px;"
                                onclick="deleteOrder(${order.id})"
                            >
                                🗑️
                            </button>
                        </div>
                    `;
                }
                // Show only "Delete" button for ready/completed orders
                else if (order.status === 'ready' || order.status === 'completed') {
                    frontHtml += `
                        <button 
                            class="btn btn-danger" 
                            style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;"
                            onclick="deleteOrder(${order.id})"
                        >
                            🗑️ Удалить заказ
                        </button>
                    `;
                }
            }
            frontFace.innerHTML = frontHtml;
            
            // Back side (green success state)
            const backFace = document.createElement('div');
            backFace.className = 'order-back';
            backFace.innerHTML = `
                <div class="name">✅ Заказ #${order.id} готов!</div>
                <div class="meta">Стол №${order.table_id}</div>
                <div class="meta">Сумма: ₽${order.total_price.toFixed(2)}</div>
                <div style="margin-top: 10px; font-size: 18px; font-weight: bold;">🍴 Можно подавать!</div>
            `;
            
            orderEl.appendChild(frontFace);
            orderEl.appendChild(backFace);
            
            // Add click to view details (only on front)
            frontFace.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
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
    
    try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Ошибка при удалении заказа');
        }
        
        alert('✅ Заказ удален');
        loadOrders();
    } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        alert('❌ Ошибка: ' + error.message);
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
        'waiter': '👔 Официант',
        'admin': '👨‍💼 Администратор'
    };
    return roles[role] || role;
}

setInterval(() => {
    if (currentUser && currentUser.role === 'chef') {
        loadOrders();
    }
}, 3000);

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App initialized');
});
