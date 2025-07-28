// Модуль управления складом

class WarehouseManager {
    constructor() {
        this.items = this.loadItems();
        this.operations = this.loadOperations();
        this.categories = this.loadCategories();
    }

    // Загрузка товаров из localStorage
    loadItems() {
        const items = localStorage.getItem('warehouse_items');
        return items ? JSON.parse(items) : this.getDefaultItems();
    }

    // Загрузка операций из localStorage
    loadOperations() {
        const operations = localStorage.getItem('warehouse_operations');
        return operations ? JSON.parse(operations) : [];
    }

    // Загрузка категорий
    loadCategories() {
        return [
            { id: 'electronics', name: 'Электроника', icon: 'fas fa-laptop' },
            { id: 'clothing', name: 'Одежда', icon: 'fas fa-tshirt' },
            { id: 'tools', name: 'Инструменты', icon: 'fas fa-tools' },
            { id: 'office', name: 'Офисные принадлежности', icon: 'fas fa-briefcase' },
            { id: 'furniture', name: 'Мебель', icon: 'fas fa-couch' },
            { id: 'books', name: 'Книги', icon: 'fas fa-book' }
        ];
    }

    // Сохранение данных в localStorage
    saveItems() {
        localStorage.setItem('warehouse_items', JSON.stringify(this.items));
    }

    saveOperations() {
        localStorage.setItem('warehouse_operations', JSON.stringify(this.operations));
    }

    // Получение товаров по умолчанию
    getDefaultItems() {
        return [
            {
                id: 1,
                name: 'Ноутбук Dell Inspiron',
                category: 'electronics',
                price: 45000,
                quantity: 15,
                description: '15.6" Full HD, Intel Core i5, 8GB RAM, 256GB SSD',
                barcode: '1234567890123',
                minQuantity: 5,
                location: 'Стеллаж A-1',
                supplier: 'Dell Inc.',
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z'
            },
            {
                id: 2,
                name: 'Принтер HP LaserJet',
                category: 'electronics',
                price: 12000,
                quantity: 8,
                description: 'Лазерный принтер, монохромный, 20 стр/мин',
                barcode: '1234567890124',
                minQuantity: 3,
                location: 'Стеллаж A-2',
                supplier: 'HP Inc.',
                createdAt: '2024-01-10T14:30:00Z',
                updatedAt: '2024-01-10T14:30:00Z'
            },
            {
                id: 3,
                name: 'Офисный стул',
                category: 'furniture',
                price: 3500,
                quantity: 25,
                description: 'Офисный стул с подлокотниками, черный',
                barcode: '1234567890125',
                minQuantity: 10,
                location: 'Стеллаж B-1',
                supplier: 'МебельСтрой',
                createdAt: '2024-01-05T09:15:00Z',
                updatedAt: '2024-01-05T09:15:00Z'
            },
            {
                id: 4,
                name: 'Бумага А4',
                category: 'office',
                price: 250,
                quantity: 100,
                description: 'Бумага А4, 80 г/м², 500 листов',
                barcode: '1234567890126',
                minQuantity: 20,
                location: 'Стеллаж C-1',
                supplier: 'ОфисМаркет',
                createdAt: '2024-01-12T11:45:00Z',
                updatedAt: '2024-01-12T11:45:00Z'
            },
            {
                id: 5,
                name: 'Отвертка крестовая',
                category: 'tools',
                price: 150,
                quantity: 50,
                description: 'Отвертка крестовая PH2, 150мм',
                barcode: '1234567890127',
                minQuantity: 15,
                location: 'Стеллаж D-1',
                supplier: 'ИнструментСтрой',
                createdAt: '2024-01-08T16:20:00Z',
                updatedAt: '2024-01-08T16:20:00Z'
            }
        ];
    }

    // Получение статистики
    async getStatistics() {
        const today = new Date().toISOString().split('T')[0];
        
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStockItems = this.items.filter(item => item.quantity <= item.minQuantity).length;
        const todayOperations = this.operations.filter(op => 
            op.date.startsWith(today)
        ).length;

        return {
            totalItems,
            totalValue,
            lowStockItems,
            todayOperations,
            totalCategories: this.categories.length,
            totalOperations: this.operations.length
        };
    }

    // Получение всех товаров
    async getAllItems() {
        return this.items;
    }

    // Получение товара по ID
    async getItemById(id) {
        return this.items.find(item => item.id === parseInt(id));
    }

    // Добавление нового товара
    async addItem(itemData) {
        const newItem = {
            id: this.getNextItemId(),
            name: itemData.itemName,
            category: itemData.itemCategory,
            price: parseFloat(itemData.itemPrice),
            quantity: parseInt(itemData.itemQuantity),
            description: itemData.itemDescription || '',
            barcode: itemData.itemBarcode || '',
            minQuantity: parseInt(itemData.itemQuantity) * 0.2, // 20% от начального количества
            location: 'Новый стеллаж',
            supplier: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.items.push(newItem);
        this.saveItems();

        // Создаем операцию прихода для нового товара
        await this.createOperation({
            type: 'incoming',
            itemId: newItem.id,
            quantity: newItem.quantity,
            notes: 'Добавление нового товара'
        });

        return newItem;
    }

    // Обновление товара
    async updateItem(id, itemData) {
        const itemIndex = this.items.findIndex(item => item.id === parseInt(id));
        if (itemIndex === -1) {
            throw new Error('Товар не найден');
        }

        this.items[itemIndex] = {
            ...this.items[itemIndex],
            ...itemData,
            updatedAt: new Date().toISOString()
        };

        this.saveItems();
        return this.items[itemIndex];
    }

    // Удаление товара
    async deleteItem(id) {
        const itemIndex = this.items.findIndex(item => item.id === parseInt(id));
        if (itemIndex === -1) {
            throw new Error('Товар не найден');
        }

        this.items.splice(itemIndex, 1);
        this.saveItems();
        return true;
    }

    // Обработка прихода
    async processIncoming(operationData) {
        const itemId = parseInt(operationData.incomingItem);
        const quantity = parseInt(operationData.incomingQuantity);
        
        const item = await this.getItemById(itemId);
        if (!item) {
            throw new Error('Товар не найден');
        }

        // Обновляем количество товара
        item.quantity += quantity;
        item.updatedAt = new Date().toISOString();
        this.saveItems();

        // Создаем операцию
        const operation = await this.createOperation({
            type: 'incoming',
            itemId: itemId,
            quantity: quantity,
            supplier: operationData.incomingSupplier || '',
            notes: operationData.incomingNotes || ''
        });

        return operation;
    }

    // Обработка расхода
    async processOutgoing(operationData) {
        const itemId = parseInt(operationData.outgoingItem);
        const quantity = parseInt(operationData.outgoingQuantity);
        
        const item = await this.getItemById(itemId);
        if (!item) {
            throw new Error('Товар не найден');
        }

        // Проверяем достаточность товара
        if (item.quantity < quantity) {
            throw new Error(`Недостаточно товара. Доступно: ${item.quantity} шт.`);
        }

        // Обновляем количество товара
        item.quantity -= quantity;
        item.updatedAt = new Date().toISOString();
        this.saveItems();

        // Создаем операцию
        const operation = await this.createOperation({
            type: 'outgoing',
            itemId: itemId,
            quantity: quantity,
            recipient: operationData.outgoingRecipient || '',
            notes: operationData.outgoingNotes || ''
        });

        return operation;
    }

    // Создание операции
    async createOperation(operationData) {
        const item = await this.getItemById(operationData.itemId);
        const currentUser = auth.getCurrentUser();

        const operation = {
            id: this.getNextOperationId(),
            type: operationData.type,
            itemId: operationData.itemId,
            itemName: item.name,
            quantity: operationData.quantity,
            employeeId: currentUser.id,
            employeeName: currentUser.name,
            date: new Date().toISOString(),
            status: 'completed',
            supplier: operationData.supplier || '',
            recipient: operationData.recipient || '',
            notes: operationData.notes || ''
        };

        this.operations.push(operation);
        this.saveOperations();

        return operation;
    }

    // Получение последних операций
    async getRecentOperations(limit = 10) {
        return this.operations
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // Получение операций по фильтрам
    async getOperations(filters = {}) {
        let filteredOperations = [...this.operations];

        // Фильтр по типу
        if (filters.type) {
            filteredOperations = filteredOperations.filter(op => op.type === filters.type);
        }

        // Фильтр по дате
        if (filters.startDate) {
            filteredOperations = filteredOperations.filter(op => 
                new Date(op.date) >= new Date(filters.startDate)
            );
        }

        if (filters.endDate) {
            filteredOperations = filteredOperations.filter(op => 
                new Date(op.date) <= new Date(filters.endDate)
            );
        }

        // Фильтр по товару
        if (filters.itemId) {
            filteredOperations = filteredOperations.filter(op => 
                op.itemId === parseInt(filters.itemId)
            );
        }

        // Сортировка
        const sortField = filters.sortBy || 'date';
        const sortOrder = filters.sortOrder || 'desc';

        filteredOperations.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (sortField === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filteredOperations;
    }

    // Поиск товаров
    async searchItems(query, filters = {}) {
        let results = [...this.items];

        // Поиск по названию и описанию
        if (query) {
            const searchQuery = query.toLowerCase();
            results = results.filter(item => 
                item.name.toLowerCase().includes(searchQuery) ||
                item.description.toLowerCase().includes(searchQuery) ||
                item.barcode.includes(searchQuery)
            );
        }

        // Фильтр по категории
        if (filters.category) {
            results = results.filter(item => item.category === filters.category);
        }

        // Фильтр по цене
        if (filters.minPrice) {
            results = results.filter(item => item.price >= filters.minPrice);
        }

        if (filters.maxPrice) {
            results = results.filter(item => item.price <= filters.maxPrice);
        }

        // Фильтр по наличию
        if (filters.inStock) {
            results = results.filter(item => item.quantity > 0);
        }

        if (filters.lowStock) {
            results = results.filter(item => item.quantity <= item.minQuantity);
        }

        return results;
    }

    // Получение товаров с низким запасом
    async getLowStockItems() {
        return this.items.filter(item => item.quantity <= item.minQuantity);
    }

    // Получение категорий
    async getCategories() {
        return this.categories;
    }

    // Добавление категории
    async addCategory(categoryData) {
        const newCategory = {
            id: categoryData.id || this.generateCategoryId(),
            name: categoryData.name,
            icon: categoryData.icon || 'fas fa-box'
        };

        this.categories.push(newCategory);
        return newCategory;
    }

    // Генерация следующего ID для товара
    getNextItemId() {
        const maxId = Math.max(...this.items.map(item => item.id), 0);
        return maxId + 1;
    }

    // Генерация следующего ID для операции
    getNextOperationId() {
        const maxId = Math.max(...this.operations.map(op => op.id), 0);
        return maxId + 1;
    }

    // Генерация ID для категории
    generateCategoryId() {
        return 'category_' + Date.now();
    }

    // Экспорт данных
    async exportData(type = 'items') {
        switch (type) {
            case 'items':
                return this.exportItems();
            case 'operations':
                return this.exportOperations();
            case 'statistics':
                return this.exportStatistics();
            default:
                throw new Error('Неизвестный тип экспорта');
        }
    }

    // Экспорт товаров
    exportItems() {
        const headers = ['ID', 'Название', 'Категория', 'Цена', 'Количество', 'Описание', 'Штрих-код', 'Местоположение'];
        const rows = this.items.map(item => [
            item.id,
            item.name,
            this.getCategoryName(item.category),
            item.price,
            item.quantity,
            item.description,
            item.barcode,
            item.location
        ]);

        return { headers, rows };
    }

    // Экспорт операций
    exportOperations() {
        const headers = ['ID', 'Дата', 'Тип', 'Товар', 'Количество', 'Сотрудник', 'Статус', 'Примечания'];
        const rows = this.operations.map(op => [
            op.id,
            new Date(op.date).toLocaleDateString('ru-RU'),
            op.type === 'incoming' ? 'Приход' : 'Расход',
            op.itemName,
            op.quantity,
            op.employeeName,
            op.status === 'completed' ? 'Завершено' : 'В обработке',
            op.notes
        ]);

        return { headers, rows };
    }

    // Экспорт статистики
    exportStatistics() {
        const stats = this.getStatistics();
        return {
            headers: ['Показатель', 'Значение'],
            rows: [
                ['Всего товаров', stats.totalItems],
                ['Общая стоимость', stats.totalValue + ' ₽'],
                ['Товары с низким запасом', stats.lowStockItems],
                ['Операций сегодня', stats.todayOperations],
                ['Всего категорий', stats.totalCategories],
                ['Всего операций', stats.totalOperations]
            ]
        };
    }

    // Получение названия категории
    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Неизвестная категория';
    }

    // Получение отчета по движению товаров
    async getMovementReport(startDate, endDate, itemId = null) {
        let operations = this.operations.filter(op => {
            const opDate = new Date(op.date);
            return opDate >= new Date(startDate) && opDate <= new Date(endDate);
        });

        if (itemId) {
            operations = operations.filter(op => op.itemId === parseInt(itemId));
        }

        const report = {
            period: { startDate, endDate },
            totalIncoming: operations.filter(op => op.type === 'incoming').length,
            totalOutgoing: operations.filter(op => op.type === 'outgoing').length,
            totalIncomingQuantity: operations
                .filter(op => op.type === 'incoming')
                .reduce((sum, op) => sum + op.quantity, 0),
            totalOutgoingQuantity: operations
                .filter(op => op.type === 'outgoing')
                .reduce((sum, op) => sum + op.quantity, 0),
            operations: operations
        };

        return report;
    }
}

// Экспорт для использования в других модулях
window.WarehouseManager = WarehouseManager; 