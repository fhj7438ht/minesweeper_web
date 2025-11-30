export class Database {
    constructor(dbName = 'MinesweeperDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error(`Ошибка подключения к базе данных: ${request.error}`));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.initializeTables(db);
            };
        });
    }

    initializeTables(db) {
        // Создаем хранилище для игр
        if (!db.objectStoreNames.contains('games')) {
            const gamesStore = db.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
            gamesStore.createIndex('player_name', 'player_name', { unique: false });
            gamesStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Создаем хранилище для ходов
        if (!db.objectStoreNames.contains('moves')) {
            const movesStore = db.createObjectStore('moves', { keyPath: 'id', autoIncrement: true });
            movesStore.createIndex('game_id', 'game_id', { unique: false });
            movesStore.createIndex('move_number', 'move_number', { unique: false });
            movesStore.createIndex('game_move', ['game_id', 'move_number'], { unique: false });
        }
    }

    getDB() { // Получение объекта базы данных
        if (!this.db) {
            throw new Error('База данных не подключена');
        }
        return this.db;
    }

    async add(storeName, data) { // Добавление записи
        const db = this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Ошибка добавления записи: ${request.error}`));
            };
        });
    }

    async update(storeName, data) { // Обновление записи
        const db = this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Ошибка обновления записи: ${request.error}`));
            };
        });
    }

    async get(storeName, id) { // Получение записи по ID
        const db = this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Ошибка получения записи: ${request.error}`));
            };
        });
    }

    async getAll(storeName) { // Получение всех записей
        const db = this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Ошибка получения записей: ${request.error}`));
            };
        });
    }

    async delete(storeName, id) { // Удаление записи
        const db = this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`Ошибка удаления записи: ${request.error}`));
            };
        });
    }

    async query(storeName, indexName, key) { // Выполнение запроса с фильтром
        const db = this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.only(key);
            const request = index.getAll(range);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error(`Ошибка выполнения запроса: ${request.error}`));
            };
        });
    }

    async getMax(storeName, indexName, key) { // Получение максимального значения из индекса
        const db = this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.only(key);
            const request = index.openCursor(range, 'prev');

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    resolve(cursor.value.move_number || 0);
                } else {
                    resolve(0);
                }
            };

            request.onerror = () => {
                reject(new Error(`Ошибка получения максимального значения: ${request.error}`));
            };
        });
    }
}

