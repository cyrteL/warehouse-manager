// Основной JavaScript файл для главной страницы

class MainApp {
    constructor() {
        this.warehouse = new WarehouseManager();
        this.init();
    }

    init() {
        // Инициализация после загрузки DOM
        $(document).ready(() => {
            this.loadDashboardData();
            this.bindEvents();
            this.initializeModals();
        });
    }

    bindEvents() {
        // Обработчики для модальных окон
        $('#saveItemBtn').on('click', () => this.addNewItem());
        $('#saveIncomingBtn').on('click', () => this.processIncoming());
        $('#saveOutgoingBtn').on('click', () => this.processOutgoing());

        // Обработчики для фильтров и поиска
        $('#searchInput').on('input', (e) => this.handleSearch(e.target.value));
        
        // Обработчики для сортировки
        $('.sortable').on('click', (e) => this.handleSort(e));

        // Обработчики для экспорта
        $('#exportBtn').on('click', () => this.exportData());
    }

    // Загрузка данных для дашборда
    async loadDashboardData() {
        try {
            // Показываем индикатор загрузки
            this.showLoading();

            // Загружаем статистику
            const stats = await this.warehouse.getStatistics();
            this.updateStatistics(stats);

            // Загружаем последние операции
            const operations = await this.warehouse.getRecentOperations(10);
            this.updateOperationsTable(operations);

            // Загружаем товары для модальных окон
            const items = await this.warehouse.getAllItems();
            this.populateItemSelects(items);

            // Скрываем индикатор загрузки
            this.hideLoading();

        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            auth.showNotification('Ошибка при загрузке данных', 'danger');
            this.hideLoading();
        }
    }

    // Обновление статистики
    updateStatistics(stats) {
        $('#totalItems').text(stats.totalItems.toLocaleString());
        $('#totalValue').text(stats.totalValue.toLocaleString() + ' ₽');
        $('#lowStock').text(stats.lowStockItems);
        $('#todayOperations').text(stats.todayOperations);
    }

    // Обновление таблицы операций
    updateOperationsTable(operations) {
        const tbody = $('#recentOperationsTable tbody');
        tbody.empty();

        if (operations.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <br>Нет операций для отображения
                    </td>
                </tr>
            `);
            return;
        }

        operations.forEach(operation => {
            const row = this.createOperationRow(operation);
            tbody.append(row);
        });
    }

    // Создание строки операции
    createOperationRow(operation) {
        const typeIcon = operation.type === 'incoming' ? 'fa-box-open text-success' : 'fa-truck text-warning';
        const typeText = operation.type === 'incoming' ? 'Приход' : 'Расход';
        const statusClass = this.getStatusClass(operation.status);
        const statusText = this.getStatusText(operation.status);

        return `
            <tr>
                <td>${this.formatDate(operation.date)}</td>
                <td>
                    <i class="fas ${typeIcon} me-1"></i>
                    ${typeText}
                </td>
                <td>${operation.itemName}</td>
                <td>${operation.quantity}</td>
                <td>${operation.employeeName}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
            </tr>
        `;
    }

    // Получение класса статуса
    getStatusClass(status) {
        switch (status) {
            case 'completed': return 'status-completed';
            case 'pending': return 'status-pending';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    }

    // Получение текста статуса
    getStatusText(status) {
        switch (status) {
            case 'completed': return 'Завершено';
            case 'pending': return 'В обработке';
            case 'cancelled': return 'Отменено';
            default: return 'Неизвестно';
        }
    }

    // Форматирование даты
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Заполнение селектов товаров
    populateItemSelects(items) {
        const selects = ['#incomingItem', '#outgoingItem'];
        
        selects.forEach(selectId => {
            const select = $(selectId);
            select.find('option:not(:first)').remove();
            
            items.forEach(item => {
                select.append(`<option value="${item.id}">${item.name} (${item.quantity} шт.)</option>`);
            });
        });
    }

    // Добавление нового товара
    async addNewItem() {
        const formData = this.getFormData('#addItemForm');
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            const newItem = await this.warehouse.addItem(formData);
            auth.showNotification('Товар успешно добавлен', 'success');
            
            // Закрываем модальное окно
            $('#addItemModal').modal('hide');
            
            // Обновляем данные
            this.loadDashboardData();
            
            // Очищаем форму
            $('#addItemForm')[0].reset();
            
        } catch (error) {
            console.error('Ошибка при добавлении товара:', error);
            auth.showNotification('Ошибка при добавлении товара', 'danger');
        }
    }

    // Обработка прихода
    async processIncoming() {
        const formData = this.getFormData('#incomingForm');
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            const operation = await this.warehouse.processIncoming(formData);
            auth.showNotification('Приход успешно оформлен', 'success');
            
            // Закрываем модальное окно
            $('#incomingModal').modal('hide');
            
            // Обновляем данные
            this.loadDashboardData();
            
            // Очищаем форму
            $('#incomingForm')[0].reset();
            
        } catch (error) {
            console.error('Ошибка при оформлении прихода:', error);
            auth.showNotification('Ошибка при оформлении прихода', 'danger');
        }
    }

    // Обработка расхода
    async processOutgoing() {
        const formData = this.getFormData('#outgoingForm');
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            const operation = await this.warehouse.processOutgoing(formData);
            auth.showNotification('Расход успешно оформлен', 'success');
            
            // Закрываем модальное окно
            $('#outgoingModal').modal('hide');
            
            // Обновляем данные
            this.loadDashboardData();
            
            // Очищаем форму
            $('#outgoingForm')[0].reset();
            
        } catch (error) {
            console.error('Ошибка при оформлении расхода:', error);
            auth.showNotification('Ошибка при оформлении расхода', 'danger');
        }
    }

    // Получение данных формы
    getFormData(formSelector) {
        const form = $(formSelector);
        const formData = {};
        
        form.find('input, select, textarea').each(function() {
            const field = $(this);
            const name = field.attr('id');
            const value = field.val();
            
            if (name) {
                formData[name] = value;
            }
        });
        
        return formData;
    }

    // Валидация формы
    validateForm(formData) {
        const requiredFields = ['itemName', 'itemCategory', 'itemPrice', 'itemQuantity'];
        
        for (const field of requiredFields) {
            if (!formData[field] || formData[field].trim() === '') {
                auth.showNotification(`Поле "${this.getFieldLabel(field)}" обязательно для заполнения`, 'warning');
                return false;
            }
        }
        
        // Проверка числовых значений
        if (formData.itemPrice && parseFloat(formData.itemPrice) < 0) {
            auth.showNotification('Цена не может быть отрицательной', 'warning');
            return false;
        }
        
        if (formData.itemQuantity && parseInt(formData.itemQuantity) < 0) {
            auth.showNotification('Количество не может быть отрицательным', 'warning');
            return false;
        }
        
        return true;
    }

    // Получение метки поля
    getFieldLabel(fieldName) {
        const labels = {
            'itemName': 'Название товара',
            'itemCategory': 'Категория',
            'itemPrice': 'Цена',
            'itemQuantity': 'Количество',
            'incomingItem': 'Товар',
            'incomingQuantity': 'Количество',
            'outgoingItem': 'Товар',
            'outgoingQuantity': 'Количество'
        };
        
        return labels[fieldName] || fieldName;
    }

    // Инициализация модальных окон
    initializeModals() {
        // Очистка форм при закрытии модальных окон
        $('.modal').on('hidden.bs.modal', function() {
            $(this).find('form')[0].reset();
        });

        // Валидация в реальном времени
        $('.form-control, .form-select').on('input change', function() {
            const field = $(this);
            const value = field.val();
            
            if (field.prop('required') && (!value || value.trim() === '')) {
                field.addClass('is-invalid');
            } else {
                field.removeClass('is-invalid');
            }
        });
    }

    // Обработка поиска
    handleSearch(query) {
        // Реализация поиска по таблице
        const table = $('#recentOperationsTable');
        const rows = table.find('tbody tr');
        
        rows.each(function() {
            const row = $(this);
            const text = row.text().toLowerCase();
            const matches = text.includes(query.toLowerCase());
            
            if (matches || query === '') {
                row.show();
            } else {
                row.hide();
            }
        });
    }

    // Обработка сортировки
    handleSort(event) {
        const column = $(event.target);
        const table = column.closest('table');
        const tbody = table.find('tbody');
        const rows = tbody.find('tr').toArray();
        
        // Определяем направление сортировки
        const isAscending = !column.hasClass('sort-asc');
        
        // Убираем классы сортировки со всех заголовков
        table.find('th').removeClass('sort-asc sort-desc');
        
        // Добавляем класс сортировки к текущему заголовку
        column.addClass(isAscending ? 'sort-asc' : 'sort-desc');
        
        // Сортируем строки
        rows.sort((a, b) => {
            const aText = $(a).find('td').eq(column.index()).text();
            const bText = $(b).find('td').eq(column.index()).text();
            
            if (isAscending) {
                return aText.localeCompare(bText, 'ru');
            } else {
                return bText.localeCompare(aText, 'ru');
            }
        });
        
        // Перестраиваем таблицу
        tbody.empty().append(rows);
    }

    // Экспорт данных
    exportData() {
        try {
            const table = $('#recentOperationsTable');
            const rows = table.find('tbody tr');
            let csv = 'Дата,Тип,Товар,Количество,Сотрудник,Статус\n';
            
            rows.each(function() {
                const cells = $(this).find('td');
                if (cells.length > 1) { // Пропускаем пустые строки
                    const row = [];
                    cells.each(function() {
                        row.push(`"${$(this).text().trim()}"`);
                    });
                    csv += row.join(',') + '\n';
                }
            });
            
            // Создаем и скачиваем файл
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `операции_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            auth.showNotification('Данные успешно экспортированы', 'success');
            
        } catch (error) {
            console.error('Ошибка при экспорте:', error);
            auth.showNotification('Ошибка при экспорте данных', 'danger');
        }
    }

    // Показать индикатор загрузки
    showLoading() {
        $('main').append(`
            <div id="loadingOverlay" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style="background: rgba(255,255,255,0.8); z-index: 9999;">
                <div class="text-center">
                    <div class="loading-spinner text-primary mb-2"></div>
                    <p class="text-muted">Загрузка данных...</p>
                </div>
            </div>
        `);
    }

    // Скрыть индикатор загрузки
    hideLoading() {
        $('#loadingOverlay').remove();
    }
}

// Инициализация приложения
const mainApp = new MainApp(); 