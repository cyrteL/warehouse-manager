// Система авторизации и управления пользователями

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Проверяем, есть ли сохраненная сессия
        this.checkSession();
        
        // Обработчики событий
        this.bindEvents();
        
        // Проверяем права доступа для текущей страницы
        this.checkPageAccess();
    }

    bindEvents() {
        // Обработчик выхода из системы
        $(document).on('click', '#logoutBtn', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Обработчик формы входа
        $(document).on('submit', '#loginForm', (e) => {
            e.preventDefault();
            this.login();
        });
    }

    // Проверка сессии
    checkSession() {
        const userData = localStorage.getItem('warehouse_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                this.updateUI();
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
                this.logout();
            }
        } else {
            // Если нет сессии и мы не на странице входа, перенаправляем
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    // Вход в систему
    login() {
        const username = $('#username').val();
        const password = $('#password').val();

        if (!username || !password) {
            this.showNotification('Пожалуйста, заполните все поля', 'warning');
            return;
        }

        // Имитация проверки учетных данных
        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // Удаляем пароль из объекта пользователя перед сохранением
            const { password, ...userData } = user;
            this.currentUser = userData;
            this.isAuthenticated = true;
            
            // Сохраняем в localStorage
            localStorage.setItem('warehouse_user', JSON.stringify(userData));
            
            this.showNotification('Успешный вход в систему', 'success');
            
            // Перенаправляем на главную страницу
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showNotification('Неверное имя пользователя или пароль', 'danger');
        }
    }

    // Выход из системы
    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('warehouse_user');
        
        this.showNotification('Вы вышли из системы', 'info');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    // Обновление интерфейса в зависимости от прав доступа
    updateUI() {
        if (!this.currentUser) return;

        // Обновляем информацию о пользователе в навигации
        $('#profileDropdown .dropdown-toggle').html(`
            <i class="fas fa-user me-1"></i>${this.currentUser.name}
        `);

        // Показываем/скрываем элементы администрирования
        if (this.hasRole('admin')) {
            $('#adminDropdown').show();
        } else {
            $('#adminDropdown').hide();
        }

        // Обновляем права доступа для кнопок
        this.updateButtonPermissions();
    }

    // Проверка прав доступа к странице
    checkPageAccess() {
        const currentPage = window.location.pathname;
        
        // Страницы, требующие авторизации
        const protectedPages = [
            '/index.html', '/catalog.html', '/history.html', '/search.html', 
            '/profile.html', '/admin/'
        ];

        // Страницы администрирования
        const adminPages = ['/admin/'];

        // Проверяем, нужна ли авторизация для текущей страницы
        const needsAuth = protectedPages.some(page => currentPage.includes(page));
        
        if (needsAuth && !this.isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        // Проверяем права администратора
        if (adminPages.some(page => currentPage.includes(page)) && !this.hasRole('admin')) {
            this.showNotification('У вас нет прав для доступа к этой странице', 'danger');
            window.location.href = 'index.html';
            return;
        }
    }

    // Обновление прав доступа для кнопок
    updateButtonPermissions() {
        // Кнопки, доступные только администраторам
        const adminButtons = [
            '#addItemBtn',
            '#editItemBtn',
            '#deleteItemBtn',
            '#manageUsersBtn'
        ];

        adminButtons.forEach(buttonId => {
            const button = $(buttonId);
            if (button.length) {
                if (this.hasRole('admin')) {
                    button.prop('disabled', false);
                } else {
                    button.prop('disabled', true);
                    button.attr('title', 'Требуются права администратора');
                }
            }
        });
    }

    // Проверка роли пользователя
    hasRole(role) {
        return this.currentUser && this.currentUser.roles && this.currentUser.roles.includes(role);
    }

    // Проверка разрешения
    hasPermission(permission) {
        return this.currentUser && this.currentUser.permissions && this.currentUser.permissions.includes(permission);
    }

    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }

    // Проверка аутентификации
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Получение списка пользователей (имитация базы данных)
    getUsers() {
        return [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                name: 'Администратор',
                email: 'admin@company.com',
                roles: ['admin'],
                permissions: ['read', 'write', 'delete', 'admin'],
                department: 'IT',
                position: 'Системный администратор'
            },
            {
                id: 2,
                username: 'manager',
                password: 'manager123',
                name: 'Менеджер склада',
                email: 'manager@company.com',
                roles: ['manager'],
                permissions: ['read', 'write'],
                department: 'Склад',
                position: 'Менеджер склада'
            },
            {
                id: 3,
                username: 'operator',
                password: 'operator123',
                name: 'Оператор',
                email: 'operator@company.com',
                roles: ['operator'],
                permissions: ['read'],
                department: 'Склад',
                position: 'Оператор склада'
            },
            {
                id: 4,
                username: 'viewer',
                password: 'viewer123',
                name: 'Наблюдатель',
                email: 'viewer@company.com',
                roles: ['viewer'],
                permissions: ['read'],
                department: 'Бухгалтерия',
                position: 'Бухгалтер'
            }
        ];
    }

    // Создание нового пользователя (только для админов)
    createUser(userData) {
        if (!this.hasRole('admin')) {
            throw new Error('Недостаточно прав для создания пользователей');
        }

        const users = this.getUsers();
        const newUser = {
            id: users.length + 1,
            ...userData,
            roles: userData.roles || ['viewer'],
            permissions: userData.permissions || ['read']
        };

        // В реальном приложении здесь был бы запрос к серверу
        console.log('Создан новый пользователь:', newUser);
        return newUser;
    }

    // Обновление пользователя
    updateUser(userId, userData) {
        if (!this.hasRole('admin')) {
            throw new Error('Недостаточно прав для редактирования пользователей');
        }

        // В реальном приложении здесь был бы запрос к серверу
        console.log('Обновлен пользователь:', userId, userData);
        return true;
    }

    // Удаление пользователя
    deleteUser(userId) {
        if (!this.hasRole('admin')) {
            throw new Error('Недостаточно прав для удаления пользователей');
        }

        // В реальном приложении здесь был бы запрос к серверу
        console.log('Удален пользователь:', userId);
        return true;
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        const toast = $(`
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `);

        // Создаем контейнер для уведомлений, если его нет
        let toastContainer = $('#toastContainer');
        if (toastContainer.length === 0) {
            toastContainer = $('<div id="toastContainer" class="toast-container position-fixed top-0 end-0 p-3"></div>');
            $('body').append(toastContainer);
        }

        toastContainer.append(toast);
        
        const bsToast = new bootstrap.Toast(toast[0]);
        bsToast.show();

        // Удаляем уведомление после скрытия
        toast.on('hidden.bs.toast', function() {
            $(this).remove();
        });
    }

    // Получение информации о правах доступа
    getAccessInfo() {
        if (!this.currentUser) return null;

        return {
            user: this.currentUser,
            roles: this.currentUser.roles,
            permissions: this.currentUser.permissions,
            canRead: this.hasPermission('read'),
            canWrite: this.hasPermission('write'),
            canDelete: this.hasPermission('delete'),
            canAdmin: this.hasPermission('admin'),
            isAdmin: this.hasRole('admin'),
            isManager: this.hasRole('manager'),
            isOperator: this.hasRole('operator'),
            isViewer: this.hasRole('viewer')
        };
    }
}

// Инициализация системы авторизации
const auth = new AuthSystem();

// Экспорт для использования в других модулях
window.auth = auth; 