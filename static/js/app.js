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
        title.textContent = 'Login';
        roleGroup.classList.add('hidden');
        toggleBtn.textContent = 'Create account';
        submitBtn.textContent = 'Login';
        document.getElementById('loginUser').placeholder = 'Enter login';
    } else {
        title.textContent = 'Registration';
        roleGroup.classList.remove('hidden');
        toggleBtn.textContent = 'Already have account? Login';
        submitBtn.textContent = 'Register';
        document.getElementById('loginUser').placeholder = 'Choose login';
    }
    form.reset();
}

async function handleLogin() {
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    const fullName = document.getElementById('loginName')?.value;
    const role = document.getElementById('loginRole')?.value;

    if (!username || !password) {
        alert('Please fill all fields');
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
                alert('ERROR: ' + (errorData.detail || 'Check login and password'));
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

            console.log('SUCCESS Login:', data);
        } else {
            if (!fullName || !role) {
                alert('Please fill all fields');
                return;
            }

            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, full_name: fullName, role })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert('ERROR: ' + (errorData.detail || 'Login already exists'));
                return;
            }

            alert('SUCCESS Account created! Now login.');
            toggleAuthMode();
            console.log('SUCCESS Registration');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('ERROR: ' + error.message);
    }
}

function handleLogout() {
    currentUser = null;
    cart = [];
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    document.getElementById('authForm').reset();
    isLoginMode = true;
    document.querySelector('.auth-card h2').textContent = 'Login';
    document.getElementById('roleGroup').classList.add('hidden');
    document.getElementById('doLogin').textContent = 'Login';
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

// WAITER: Table Status Management
async function loadTablesForStatus() {
    try {
        const response = await fetch(`${API_URL}/api/tables/`);
        const tables = await response.json();
        
        const tablesStatusContent = document.getElementById('tablesStatusContent');
        tablesStatusContent.innerHTML = '';
        
        if (tables.length === 0) {
            tablesStatusContent.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No tables</p>';
            return;
        }
        
        tables.forEach(table => {
            const tableCard = document.createElement('div');
            tableCard.className = `table-card ${table.is_occupied ? 'occupied' : 'free'}`;
            
            tableCard.innerHTML = `
                <div class="number">Table #${table.table_number}</div>
                <div class="seats">Seats: ${table.seats}</div>
                <div class="status ${table.is_occupied ? 'occupied' : 'free'}">
                    ${table.is_occupied ? 'OCCUPIED' : 'FREE'}
                </div>
                <div class="actions">
                    ${table.is_occupied ? 
                        `<button class="btn btn-success" style="width: 100%;" onclick="toggleTableStatus(${table.id}, false)">Mark Free</button>` :
                        `<button class="btn btn-danger" style="width: 100%;" onclick="toggleTableStatus(${table.id}, true)">Mark Occupied</button>`
                    }
                </div>
            `;
            
            tablesStatusContent.appendChild(tableCard);
        });
    } catch (error) {
        console.error('Error loading tables for status:', error);
    }
}

async function toggleTableStatus(tableId, isOccupied) {
    try {
        const response = await fetch(`${API_URL}/api/tables/${tableId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_occupied: isOccupied })
        });

        if (!response.ok) throw new Error('Error updating table status');
        
        alert(isOccupied ? 'Table marked as occupied' : 'Table marked as free');
        loadTablesForStatus();
    } catch (error) {
        console.error('Error toggling table status:', error);
        alert('ERROR: ' + error.message);
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
            menuContent.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No menu items</p>';
            return;
        }
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'item';
            
            let html = `
                <div class="name">${item.name}</div>
                <div class="desc">${item.description || 'No description'}</div>
                <div class="meta">Rubles ${item.price.toFixed(2)}</div>
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
                        Add to order
                    </button>
                `;
            }
            
            itemEl.innerHTML = html;
            menuContent.appendChild(itemEl);
        });
        
        document.getElementById('statOrders').textContent = items.length;
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuContent').innerHTML = '<p style="color: red;">ERROR loading menu</p>';
    }
}

function addToCartById(itemId) {
    const id = parseInt(itemId, 10);
    const menuItem = allMenuItems.find(item => item.id === id);

    if (!menuItem) {
        alert('ERROR Item not found');
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
    alert(`SUCCESS "${menuItem.name}" added to order!`);
}

// ADMIN: Menu Management
async function loadMenuForManagement() {
    try {
        const response = await fetch(`${API_URL}/api/menu/`);
        const items = await response.json();
        
        const menuManageContent = document.getElementById('menuManageContent');
        menuManageContent.innerHTML = '';
        
        if (items.length === 0) {
            menuManageContent.innerHTML = '<p style="text-align: center; color: #999;">No dishes</p>';
        } else {
            items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                itemEl.innerHTML = `
                    <div class="name">${item.name}</div>
                    <div class="desc">${item.description}</div>
                    <div class="meta">Rubles ${item.price} | ${item.category}</div>
                    <button class="btn btn-danger" style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;" onclick="deleteMenuItem(${item.id})">Delete</button>
                `;
                menuManageContent.appendChild(itemEl);
            });
        }
    } catch (error) {
        console.error('Error loading menu for management:', error);
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
        alert('ERROR Please fill required fields');
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
            alert('ERROR: ' + (errorData.detail || 'Unknown error'));
            return;
        }

        const item = await response.json();
        alert(`SUCCESS Dish "${item.name}" added`);
        closeAddMenuItemModal();
        loadMenuForManagement();
        loadMenuItems();
    } catch (error) {
        console.error('Error saving menu item:', error);
        alert('ERROR: ' + error.message);
    }
}

async function deleteMenuItem(itemId) {
    if (!confirm('WARNING Are you sure? This action cannot be undone.')) return;
    
    const id = parseInt(itemId, 10);
    
    try {
        const response = await fetch(`${API_URL}/api/menu/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Deletion error');
        
        alert('SUCCESS Dish deleted');
        loadMenuForManagement();
        loadMenuItems();
    } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('ERROR: ' + error.message);
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
            tablesManageContent.innerHTML = '<p style="text-align: center; color: #999;">No tables</p>';
        } else {
            tables.forEach(table => {
                const tableEl = document.createElement('div');
                tableEl.className = 'item';
                tableEl.style.borderTop = table.is_occupied ? '4px solid #e74c3c' : '4px solid #2ecc71';
                tableEl.innerHTML = `
                    <div class="name">Table #${table.table_number}</div>
                    <div class="desc">Seats: ${table.seats}</div>
                    <div class="meta" style="color: ${table.is_occupied ? '#e74c3c' : '#2ecc71'};">${table.is_occupied ? 'OCCUPIED' : 'FREE'}</div>
                    <button class="btn btn-danger" style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;" onclick="deleteTable(${table.id})">Delete</button>
                `;
                tablesManageContent.appendChild(tableEl);
            });
        }
    } catch (error) {
        console.error('Error loading tables for management:', error);
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
        alert('ERROR Please enter correct data');
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
            alert('ERROR: ' + (errorData.detail || 'Unknown error'));
            return;
        }

        const table = await response.json();
        alert(`SUCCESS Table #${table.table_number} added`);
        closeAddTableModal();
        loadTablesForManagement();
    } catch (error) {
        console.error('Error saving table:', error);
        alert('ERROR: ' + error.message);
    }
}

async function deleteTable(tableId) {
    if (!confirm('WARNING Are you sure? This action cannot be undone.')) return;
    
    const id = parseInt(tableId, 10);
    
    try {
        const response = await fetch(`${API_URL}/api/tables/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Deletion error');
        
        alert('SUCCESS Table deleted');
        loadTablesForManagement();
    } catch (error) {
        console.error('Error deleting table:', error);
        alert('ERROR: ' + error.message);
    }
}

// Employees
async function loadEmployees() {
    try {
        console.log('LOAD Loading employees...');
        const response = await fetch(`${API_URL}/api/employees/`);
        
        if (!response.ok) {
            throw new Error(`Error loading employees: ${response.status}`);
        }
        
        const employees = await response.json();
        console.log('SUCCESS Employees loaded:', employees);
        
        const tableBody = document.getElementById('employeesTableBody');
        tableBody.innerHTML = '';
        
        if (employees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No employees</td></tr>';
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
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="editEmployee(${emp.id}, '${emp.username}', '${emp.full_name}', '${emp.role}')">Edit</button>
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="deleteEmployee(${emp.id})">Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.getElementById('statEmployees').textContent = employees.length;
    } catch (error) {
        console.error('Error loading employees:', error);
        alert('ERROR when loading employees: ' + error.message);
    }
}

function addEmployeeModal() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('ERROR Only admins can add employees');
        return;
    }
    
    console.log('OPEN Opening employee modal');
    editingEmployeeId = null;
    document.getElementById('modalTitle').textContent = 'Add employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('empPassword').parentElement.style.display = 'block';
    document.getElementById('employeeModal').classList.remove('hidden');
}

function editEmployee(id, username, fullName, role) {
    console.log('EDIT Editing employee:', id);
    editingEmployeeId = id;
    document.getElementById('modalTitle').textContent = 'Edit employee';
    document.getElementById('empUsername').value = username;
    document.getElementById('empName').value = fullName;
    document.getElementById('empRole').value = role;
    document.getElementById('empPassword').value = '';
    document.getElementById('empPassword').placeholder = 'Leave empty to not change password';
    document.getElementById('empPassword').parentElement.style.display = 'block';
    document.getElementById('employeeModal').classList.remove('hidden');
}

async function deleteEmployee(id) {
    if (!confirm('WARNING Are you sure you want to delete employee?')) {
        return;
    }
    
    try {
        console.log('DELETE Deleting employee:', id);
        const response = await fetch(`${API_URL}/api/employees/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert('ERROR when deleting: ' + (errorData.detail || 'Unknown error'));
            return;
        }

        alert('SUCCESS Employee deleted');
        loadEmployees();
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('ERROR: ' + error.message);
    }
}

function closeEmployeeModal() {
    console.log('CLOSE Closing modal');
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

    console.log('SAVE Saving employee:', { username, name, role, isEdit: !!editingEmployeeId });

    if (!username || !name || !role) {
        alert('ERROR Please fill required fields');
        return;
    }

    if (!editingEmployeeId && !password) {
        alert('ERROR Please enter password');
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
        
        console.log('SEND Sending data:', employeeData);
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });

        console.log('RESPONSE Server response:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.log('ERROR Server error:', errorData);
            alert('ERROR: ' + (errorData.detail || 'Unknown error'));
            return;
        }

        const employee = await response.json();
        console.log('SUCCESS Employee saved:', employee);
        
        const action = editingEmployeeId ? 'updated' : 'created';
        alert(`SUCCESS Employee "${employee.full_name}" (role: ${getRoleText(employee.role)}) ${action}!`);
        closeEmployeeModal();
        loadEmployees();
    } catch (error) {
        console.error('Error saving employee:', error);
        alert('ERROR when saving: ' + error.message);
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
                <p>Your order is empty</p>
                <p>Add dishes from menu</p>
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
                        Rubles ${item.price} x ${item.quantity} = Rubles ${itemTotal.toFixed(2)}
                    </p>
                </div>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <button class="btn btn-secondary" style="width: 30px; height: 30px; padding: 0;" onclick="changeQuantity(${index}, -1)">-</button>
                    <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="btn btn-secondary" style="width: 30px; height: 30px; padding: 0;" onclick="changeQuantity(${index}, 1)">+</button>
                    <button class="btn btn-danger" style="width: 40px; height: 30px; padding: 0; margin-left: 10px;" onclick="removeFromCart(${index})">x</button>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    html += `
        <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                <span>Total:</span>
                <span>Rubles ${total.toFixed(2)}</span>
            </div>
            <div class="form-group">
                <label>Select table</label>
                <select id="orderTableSelect">
                    <option value="">Select table</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="createOrder()">Complete Order</button>
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
                option.textContent = `Table #${table.table_number} (${table.seats} seats)`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading tables for order:', error);
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
    alert(`"${itemName}" removed from order`);
    loadCart();
    updateCartBadge();
}

async function createOrder() {
    const tableSelect = document.getElementById('orderTableSelect');
    const tableId = tableSelect.value;
    
    if (!tableId) {
        alert('WARNING Please select a free table!');
        return;
    }
    
    if (cart.length === 0) {
        alert('ERROR Order is empty');
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
            alert('ERROR when creating order: ' + (errorData.detail || 'Unknown error'));
            return;
        }

        const order = await response.json();
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        alert(`SUCCESS Order #${order.id} completed!\n\nTable: ${tableSelect.options[tableSelect.selectedIndex].text}\nTotal: Rubles ${totalPrice.toFixed(2)}\n\nYour order accepted. Wait for ready.`);
        
        cart = [];
        updateCartBadge();
        loadCart();
    } catch (error) {
        console.error('Error creating order:', error);
        alert('ERROR: ' + error.message);
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
            ordersList.innerHTML = '<p style="text-align: center; color: #999;">No orders</p>';
            return;
        }
        
        let active = 0;
        orders.forEach(order => {
            if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready') {
                active++;
            }
            
            const orderEl = document.createElement('div');
            orderEl.className = 'order';
            
            let html = `
                <div class="name">Order #${order.id} - Table #${order.table_id}</div>
                <div class="meta">Status: <strong>${getStatusText(order.status)}</strong></div>
                <div class="meta">Total: Rubles ${order.total_price.toFixed(2)}</div>
            `;
            
            if (currentUser && (currentUser.role === 'chef' || currentUser.role === 'admin')) {
                if (order.status === 'pending' || order.status === 'confirmed') {
                    html += `
                        <button 
                            class="btn btn-primary" 
                            style="width: 100%; margin-top: 10px; font-size: 12px; padding: 8px;"
                            onclick="markOrderReady(${order.id})"
                        >
                            Order ready
                        </button>
                    `;
                }
            }
            
            orderEl.innerHTML = html;
            orderEl.style.cursor = 'pointer';
            orderEl.addEventListener('click', () => showOrderDetails(order));
            ordersList.appendChild(orderEl);
        });
        
        document.getElementById('statActive').textContent = active;
        document.getElementById('statOrders').textContent = orders.length;
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function markOrderReady(orderId) {
    try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ready' })
        });

        if (!response.ok) {
            throw new Error('Error updating order status');
        }

        alert('SUCCESS Order marked as ready!');
        loadOrders();
    } catch (error) {
        console.error('Error marking order ready:', error);
        alert('ERROR: ' + error.message);
    }
}

function showOrderDetails(order) {
    let itemsHtml = '<div style="margin-top: 10px;">';
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            itemsHtml += `
                <div style="padding: 8px; background: #f9f9f9; margin-bottom: 8px; border-radius: 4px;">
                    <strong>${item.name || 'Item'}</strong><br>
                    Qty: ${item.quantity} x Rubles ${item.price.toFixed(2)}
                </div>
            `;
        });
    } else {
        itemsHtml += '<p style="color: #999;">No items in order</p>';
    }
    itemsHtml += '</div>';

    document.getElementById('orderDetails').innerHTML = `
        <div style="margin-bottom: 15px;">
            <h4>Order #${order.id}</h4>
            <p><strong>Table:</strong> #${order.table_id}</p>
            <p><strong>Status:</strong> ${getStatusText(order.status)}</p>
            <p><strong>Total:</strong> Rubles ${order.total_price.toFixed(2)}</p>
        </div>
        <h4>Items:</h4>
        ${itemsHtml}
    `;
    
    document.getElementById('orderModal').classList.remove('hidden');
}

function getStatusText(status) {
    const statuses = {
        'pending': 'Waiting',
        'confirmed': 'Confirmed',
        'ready': 'Ready',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status;
}

function getRoleText(role) {
    const roles = {
        'chef': 'Chef',
        'waiter': 'Waiter',
        'admin': 'Administrator'
    };
    return roles[role] || role;
}

setInterval(() => {
    if (currentUser && currentUser.role === 'chef') {
        loadOrders();
    }
}, 3000);

window.addEventListener('DOMContentLoaded', () => {
    console.log('SUCCESS App initialized');
});
