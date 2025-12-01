import { Game } from './Game.js';
import { Database } from './Database.js';
import { GameRepository } from './GameRepository.js';
import { View } from './View.js';


export class Controller { // Контроллер для управления игрой
    constructor() {
        this.database = null;
        this.gameRepository = null;
        this.currentGame = null;
        this.currentGameId = null;
        this.currentPlayerName = null;
        this.isInitialized = false;
    }

    async initialize() { // Инициализация базы данных
        if (this.isInitialized) {
            return;
        }

        try {
            this.database = new Database();
            await this.database.connect();
            this.gameRepository = new GameRepository(this.database);
            this.isInitialized = true;
            this.setupEventListeners();
        } catch (error) {
            console.error('Ошибка инициализации базы данных:', error);
            View.showMessage('Ошибка инициализации базы данных: ' + error.message, 'error');
        }
    }

    setupEventListeners() { // Настройка обработчиков событий
        // Форма новой игры
        document.getElementById('new-game-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startNewGame();
        });

        // Кнопка списка игр
        document.getElementById('show-list-btn').addEventListener('click', () => {
            this.showGameList();
        });

        // Ссылка на список игр из начального экрана
        document.getElementById('show-list-link-start').addEventListener('click', (e) => {
            e.preventDefault();
            this.showGameList();
        });

        // Ссылка на список игр из игрового экрана
        document.getElementById('show-list-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showGameList();
        });

        // Ссылка на воспроизведение текущей игры
        document.getElementById('replay-current-link').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentGameId) {
                this.replayGame(this.currentGameId);
            }
        });

        // Кнопка новой игры из игрового экрана
        document.getElementById('new-game-btn').addEventListener('click', () => {
            View.showStartScreen();
        });

        // Кнопка сохранения игры
        document.getElementById('save-game-btn').addEventListener('click', () => {
            this.saveCurrentGame();
        });

        // Кнопка возврата в меню
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            View.showStartScreen();
        });

        // Кнопка возврата из списка
        document.getElementById('back-from-list-btn').addEventListener('click', () => {
            View.showStartScreen();
        });

        // Кнопка возврата из воспроизведения
        document.getElementById('back-from-replay-btn').addEventListener('click', () => {
            View.showStartScreen();
        });

        // Обработчики для списка игр (делегирование событий)
        document.getElementById('games-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('replay-btn')) {
                const gameId = parseInt(e.target.dataset.gameId);
                this.replayGame(gameId);
            } else if (e.target.classList.contains('continue-btn')) {
                const gameId = parseInt(e.target.dataset.gameId);
                this.continueGame(gameId);
            } else if (e.target.classList.contains('delete-btn')) {
                const gameId = parseInt(e.target.dataset.gameId);
                this.deleteGame(gameId);
            }
        });
    }

    async startNewGame() {
        try {
            const playerName = document.getElementById('player-name').value.trim() || 'Player';
            const rows = parseInt(document.getElementById('rows').value) || 9;
            const cols = parseInt(document.getElementById('cols').value) || 9;
            const mines = parseInt(document.getElementById('mines').value) || 10;

            // Валидация имени
            if (!/^[a-zA-Z\s]+$/.test(playerName)) {
                View.showMessage('Имя должно содержать только английские буквы и пробелы!', 'error');
                return;
            }

            // Валидация параметров
            if (rows < 1 || cols < 1 || mines < 1 || mines >= rows * cols) {
                View.showMessage('Некорректные параметры игры!', 'error');
                return;
            }

            // Создаем новую игру
            const game = new Game(rows, cols, mines);
            
            // Сохраняем игру в базу данных
            const gameId = await this.gameRepository.saveGame(game, playerName);
            
            this.currentGame = game;
            this.currentGameId = gameId;
            this.currentPlayerName = playerName;

            // Показываем игровой экран
            View.showGameScreen();
            this.updateGameDisplay();
            this.setupBoardEventListeners();
            
            View.showMessage(`Игра создана с ID: ${gameId}`, 'success');
        } catch (error) {
            console.error('Ошибка создания игры:', error);
            View.showMessage('Ошибка создания игры: ' + error.message, 'error');
        }
    }

    async showGameList() {
        try {
            const games = await this.gameRepository.getAllGames();
            View.showGameList(games);
            View.showListScreen();
        } catch (error) {
            console.error('Ошибка получения списка игр:', error);
            View.showMessage('Ошибка получения списка игр: ' + error.message, 'error');
        }
    }

    async continueGame(gameId) {
        try {
            const game = await this.gameRepository.loadGame(gameId);
            
            if (!game) {
                View.showMessage(`Игра с ID ${gameId} не найдена!`, 'error');
                return;
            }

            if (game.isGameOver() || game.isGameWon()) {
                View.showMessage('Эта игра уже завершена. Используйте "Воспроизвести" для просмотра.', 'error');
                return;
            }

            this.currentGame = game;
            this.currentGameId = gameId;
            
            // Получаем имя игрока из базы
            const gameData = await this.database.get('games', gameId);
            this.currentPlayerName = gameData.player_name;

            View.showGameScreen();
            this.updateGameDisplay();
            this.setupBoardEventListeners();
            
            View.showMessage(`Игра #${gameId} загружена`, 'success');
        } catch (error) {
            console.error('Ошибка загрузки игры:', error);
            View.showMessage('Ошибка загрузки игры: ' + error.message, 'error');
        }
    }

    async replayGame(gameId) {
        try {
            const game = await this.gameRepository.loadGame(gameId);
            
            if (!game) {
                View.showMessage(`Игра с ID ${gameId} не найдена!`, 'error');
                return;
            }

            const moves = await this.gameRepository.getGameMoves(gameId);
            const gameData = await this.database.get('games', gameId);

            View.showReplayScreen();
            View.showReplay(gameData, moves);
            
            // Отображаем финальное состояние доски
            const replayBoard = document.getElementById('replay-board');
            View.displayBoard(game, replayBoard, true);
        } catch (error) {
            console.error('Ошибка воспроизведения игры:', error);
            View.showMessage('Ошибка воспроизведения игры: ' + error.message, 'error');
        }
    }

    async deleteGame(gameId) {
        if (!confirm(`Вы уверены, что хотите удалить игру #${gameId}?`)) {
            return;
        }

        try {
            await this.gameRepository.deleteGame(gameId);
            View.showMessage(`Игра #${gameId} удалена`, 'success');
            this.showGameList(); // Обновляем список
        } catch (error) {
            console.error('Ошибка удаления игры:', error);
            View.showMessage('Ошибка удаления игры: ' + error.message, 'error');
        }
    }

    async saveCurrentGame() {
        if (!this.currentGame || !this.currentGameId) {
            View.showMessage('Нет активной игры для сохранения', 'error');
            return;
        }

        try {
            await this.gameRepository.updateGame(this.currentGameId, this.currentGame);
            View.showMessage('Игра сохранена', 'success');
        } catch (error) {
            console.error('Ошибка сохранения игры:', error);
            View.showMessage('Ошибка сохранения игры: ' + error.message, 'error');
        }
    }

    setupBoardEventListeners() { // Настройка обработчиков событий для игрового поля
        const board = document.getElementById('game-board');
        
        // Удаляем старые обработчики
        const newBoard = board.cloneNode(true);
        board.parentNode.replaceChild(newBoard, board);

        // Добавляем новые обработчики
        newBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell') && !e.target.classList.contains('game-over')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleCellClick(row, col, false);
            }
        });

        newBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell') && !e.target.classList.contains('game-over')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleCellClick(row, col, true);
            }
        });
    }

    async handleCellClick(row, col, isRightClick) { // Обработка клика по ячейке
        if (!this.currentGame || this.currentGame.isGameOver() || this.currentGame.isGameWon()) {
            return;
        }

        try {
            let result = false;
            let action = '';
            let resultText = '';

            if (isRightClick) {
                // Отметка ячейки
                result = this.currentGame.flagCell(row, col);
                action = 'flag';
                resultText = result ? 'отмечена' : 'снята отметка';
            } else {
                // Открытие ячейки
                result = this.currentGame.openCell(row, col);
                action = 'open';
            }

            // Проверяем статус игры после хода
            const gameOver = this.currentGame.isGameOver();
            const gameWon = this.currentGame.isGameWon();
            
            if (!isRightClick) {
                // Определяем результат хода для открытия ячейки
                if (gameOver) {
                    resultText = 'взорвался';
                } else if (gameWon) {
                    resultText = 'выиграл';
                } else {
                    resultText = 'мины нет';
                }
            }

            // Обновляем отображение и сохраняем, если:
            // 1. Ход был успешным (result === true)
            // 2. ИЛИ игра окончена проигрышем (даже если result === false)
            // 3. ИЛИ игра выиграна
            if (result || gameOver || gameWon) {
                // Сохраняем ход
                const moveNumber = await this.gameRepository.getNextMoveNumber(this.currentGameId);
                await this.gameRepository.saveMove(this.currentGameId, moveNumber, row, col, action, resultText);
                
                // Обновляем игру в базе данных
                await this.gameRepository.updateGame(this.currentGameId, this.currentGame);
                
                // Обновляем отображение СРАЗУ, чтобы показать все мины
                this.updateGameDisplay();
                
                // Показываем статус игры и сообщения
                if (gameOver) {
                    View.showGameStatus(this.currentGame);
                    View.showMessage('Игра окончена! Вы проиграли!', 'error');
                    // Блокируем дальнейшие клики
                    this.setupBoardEventListeners();
                } else if (gameWon) {
                    View.showGameStatus(this.currentGame);
                    View.showMessage('Поздравляем! Вы выиграли!', 'success');
                    // Блокируем дальнейшие клики
                    this.setupBoardEventListeners();
                }
            }
        } catch (error) {
            console.error('Ошибка обработки хода:', error);
            View.showMessage('Ошибка обработки хода: ' + error.message, 'error');
        }
    }

    updateGameDisplay() { // Обновление отображения игры
        if (!this.currentGame) {
            return;
        }

        const board = document.getElementById('game-board');
        View.displayBoard(this.currentGame, board);
        
        View.updateGameInfo(
            this.currentPlayerName,
            this.currentGame.getOpenedCellsCount(),
            this.currentGame.getMinesCount(),
            this.currentGameId
        );
        
        View.showGameStatus(this.currentGame);
        
        // Показываем/скрываем ссылку на воспроизведение в зависимости от статуса игры
        const replayLink = document.getElementById('replay-current-link');
        if (this.currentGame && (this.currentGame.isGameOver() || this.currentGame.isGameWon())) {
            replayLink.classList.remove('hidden');
        } else {
            replayLink.classList.add('hidden');
        }
        
        // Переустанавливаем обработчики событий после обновления доски
        this.setupBoardEventListeners();
    }
}

