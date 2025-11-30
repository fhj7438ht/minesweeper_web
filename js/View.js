import { Game } from './Game.js';


export class View {

    static showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('list-screen').classList.add('hidden');
        document.getElementById('replay-screen').classList.add('hidden');
    }

    static showGameScreen() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('list-screen').classList.add('hidden');
        document.getElementById('replay-screen').classList.add('hidden');
    }

    static showListScreen() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('list-screen').classList.remove('hidden');
        document.getElementById('replay-screen').classList.add('hidden');
    }


    static showReplayScreen() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('list-screen').classList.add('hidden');
        document.getElementById('replay-screen').classList.remove('hidden');
    }


    static displayBoard(game, boardElement, isReplay = false) {
        const board = game.getBoardDisplay();
        const dimensions = game.getDimensions();
        const rows = dimensions.rows;
        const cols = dimensions.cols;

        // Очищаем поле
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        // Создаем ячейки
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const cellValue = board[row][col];
                const visibleValue = game.getVisibleState()[row][col];
                const boardState = game.getBoardState();
                const isMine = boardState[row][col] === Game.MINE;

                // Если игра окончена проигрышем, показываем все мины
                if (game.isGameOver()) {
                    if (isMine) {
                        // Показываем все мины
                        if (visibleValue === Game.FLAGGED) {
                            // Если мина была правильно отмечена, оставляем флаг
                            cell.textContent = 'P';
                            cell.classList.add('flagged');
                        } else {
                            // Показываем мину (взорвавшуюся или неотмеченную)
                            cell.textContent = '*';
                            cell.classList.add('mine');
                        }
                    } else if (visibleValue === Game.UNOPENED) {
                        // Неоткрытые безопасные ячейки остаются закрытыми
                        cell.textContent = '';
                    } else if (visibleValue === Game.FLAGGED) {
                        // Неправильно отмеченные ячейки (где нет мины)
                        cell.textContent = 'P';
                        cell.classList.add('flagged');
                        cell.style.background = '#FFC0C0'; // Красноватый фон для неправильных флагов
                    } else if (visibleValue === Game.MINE) {
                        // Это не должно происходить для безопасных ячеек, но на всякий случай
                        cell.textContent = '*';
                        cell.classList.add('mine');
                    } else if (cellValue === ' ') {
                        cell.textContent = '';
                        cell.classList.add('opened');
                    } else {
                        cell.textContent = cellValue;
                        cell.classList.add('opened', `number-${cellValue}`);
                    }
                } else {
                    // Обычное отображение во время игры
                    if (visibleValue === Game.UNOPENED) {
                        cell.textContent = '';
                    } else if (visibleValue === Game.FLAGGED) {
                        cell.textContent = 'P';
                        cell.classList.add('flagged');
                    } else if (visibleValue === Game.MINE) {
                        cell.textContent = '*';
                        cell.classList.add('mine');
                    } else if (cellValue === ' ') {
                        cell.textContent = '';
                        cell.classList.add('opened');
                    } else {
                        cell.textContent = cellValue;
                        cell.classList.add('opened', `number-${cellValue}`);
                    }
                }

                // Если игра окончена, блокируем взаимодействие
                if (game.isGameOver() || game.isGameWon() || isReplay) {
                    cell.classList.add('game-over');
                }

                boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Обновление информации об игре
     */
    static updateGameInfo(playerName, openedCells, minesCount, gameId) {
        document.getElementById('current-player').textContent = playerName;
        document.getElementById('opened-cells').textContent = openedCells;
        document.getElementById('mines-count').textContent = minesCount;
        document.getElementById('game-id').textContent = gameId;
    }

    /**
     * Отображение сообщения
     */
    static showMessage(message, type = 'info') {
        const messageArea = document.getElementById('message-area');
        messageArea.textContent = message;
        messageArea.className = `message-area show ${type}`;
        
        // Для сообщений об ошибках и успехе не скрываем автоматически
        if (type === 'error' || type === 'success') {
            // Оставляем сообщение видимым
            return;
        }
        
        // Автоматически скрываем обычные сообщения через 3 секунды
        setTimeout(() => {
            messageArea.classList.remove('show');
        }, 3000);
    }

    /**
     * Отображение статуса игры
     */
    static showGameStatus(game) {
        const statusElement = document.getElementById('game-status');
        statusElement.className = 'game-status';

        if (game.isGameWon()) {
            statusElement.textContent = 'Поздравляем! Вы выиграли!';
            statusElement.classList.add('win');
        } else if (game.isGameOver()) {
            statusElement.textContent = 'Игра окончена! Вы проиграли!';
            statusElement.classList.add('lose');
        } else {
            statusElement.textContent = '';
        }
    }

    /**
     * Отображение списка игр
     */
    static showGameList(games) {
        const gamesList = document.getElementById('games-list');
        gamesList.innerHTML = '';

        if (games.length === 0) {
            gamesList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Сохраненных игр не найдено.</p>';
            return;
        }

        games.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';

            const status = game.game_over ? 'lost' : (game.game_won ? 'won' : 'active');
            const statusText = game.game_over ? 'Проигрыш' : (game.game_won ? 'Победа' : 'Активна');
            const created = new Date(game.created_at).toLocaleString('ru-RU');
            const updated = new Date(game.updated_at).toLocaleString('ru-RU');

            gameItem.innerHTML = `
                <div class="game-item-info">
                    <h3>
                        Игра #${game.id}
                        <span class="status-badge ${status}">${statusText}</span>
                    </h3>
                    <p><strong>Игрок:</strong> ${game.player_name}</p>
                    <p><strong>Размер:</strong> ${game.rows} × ${game.cols}</p>
                    <p><strong>Мины:</strong> ${game.mines}</p>
                    <p><strong>Создана:</strong> ${created}</p>
                    <p><strong>Обновлена:</strong> ${updated}</p>
                </div>
                <div class="game-item-actions">
                    <button class="btn btn-primary replay-btn" data-game-id="${game.id}">Воспроизвести</button>
                    <button class="btn btn-secondary continue-btn" data-game-id="${game.id}">Продолжить</button>
                    <button class="btn btn-secondary delete-btn" data-game-id="${game.id}">Удалить</button>
                </div>
            `;

            gamesList.appendChild(gameItem);
        });
    }

    /**
     * Отображение воспроизведения игры
     */
    static showReplay(gameData, moves) {
        document.getElementById('replay-game-id').textContent = gameData.id;
        document.getElementById('replay-player').textContent = gameData.player_name;
        document.getElementById('replay-size').textContent = `${gameData.rows} × ${gameData.cols}`;
        document.getElementById('replay-mines').textContent = gameData.mines;
        
        const status = gameData.game_over ? 'Проигрыш' : (gameData.game_won ? 'Победа' : 'Активна');
        document.getElementById('replay-status').textContent = status;

        // Отображаем ходы
        const movesList = document.getElementById('replay-moves');
        movesList.innerHTML = '';

        if (moves.length === 0) {
            movesList.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">В этой игре не было сделано ходов.</p>';
        } else {
            moves.forEach(move => {
                const moveItem = document.createElement('div');
                moveItem.className = 'move-item';
                const action = move.action === 'open' ? 'открыть' : 'отметить';
                moveItem.innerHTML = `
                    <p><strong>Ход ${move.move_number}:</strong> (${move.row + 1}, ${move.col + 1}) - ${action} - ${move.result}</p>
                `;
                movesList.appendChild(moveItem);
            });
        }
    }

    /**
     * Очистка сообщений
     */
    static clearMessage() {
        const messageArea = document.getElementById('message-area');
        messageArea.classList.remove('show');
    }
}

