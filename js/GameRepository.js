import { Database } from './Database.js';
import { Game } from './Game.js';


export class GameRepository {
    constructor(database) {
        this.database = database;
    }

    async saveGame(game, playerName) {
        try {
            const gameData = {
                player_name: playerName,
                rows: game.getDimensions().rows,
                cols: game.getDimensions().cols,
                mines: game.getMinesCount(),
                board_state: this.serializeGameState(game),
                visible_state: this.serializeVisibleState(game),
                game_over: game.isGameOver(),
                game_won: game.isGameWon(),
                opened_cells: game.getOpenedCellsCount(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const gameId = await this.database.add('games', gameData);
            return gameId;
        } catch (error) {
            throw new Error(`Ошибка сохранения игры: ${error.message}`);
        }
    }

    async updateGame(gameId, game) {
        try {
            const existingGame = await this.database.get('games', gameId);
            
            if (!existingGame) {
                return false;
            }

            existingGame.board_state = this.serializeGameState(game);
            existingGame.visible_state = this.serializeVisibleState(game);
            existingGame.game_over = game.isGameOver();
            existingGame.game_won = game.isGameWon();
            existingGame.opened_cells = game.getOpenedCellsCount();
            existingGame.updated_at = new Date().toISOString();

            await this.database.update('games', existingGame);
            return true;
        } catch (error) {
            throw new Error(`Ошибка обновления игры: ${error.message}`);
        }
    }

    async loadGame(gameId) {
        try {
            const gameData = await this.database.get('games', gameId);
            
            if (!gameData) {
                return null;
            }

            return this.deserializeGame(gameData);
        } catch (error) {
            throw new Error(`Ошибка загрузки игры: ${error.message}`);
        }
    }

    async getAllGames() {
        try {
            const games = await this.database.getAll('games');
            
            // Сортируем по дате создания (новые первыми)
            return games.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (error) {
            throw new Error(`Ошибка получения списка игр: ${error.message}`);
        }
    }

    async getActiveGames() {
        try {
            const allGames = await this.database.getAll('games');
            return allGames.filter(game => !game.game_over && !game.game_won)
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        } catch (error) {
            throw new Error(`Ошибка получения активных игр: ${error.message}`);
        }
    }

    async deleteGame(gameId) {
        try {
            const moves = await this.database.query('moves', 'game_id', gameId);
            for (const move of moves) {
                await this.database.delete('moves', move.id);
            }

            await this.database.delete('games', gameId);
            return true;
        } catch (error) {
            throw new Error(`Ошибка удаления игры: ${error.message}`);
        }
    }

    async saveMove(gameId, moveNumber, row, col, action, result) {
        try {
            const moveData = {
                game_id: gameId,
                move_number: moveNumber,
                row: row,
                col: col,
                action: action,
                result: result,
                created_at: new Date().toISOString()
            };

            await this.database.add('moves', moveData);
        } catch (error) {
            throw new Error(`Ошибка сохранения хода: ${error.message}`);
        }
    }

    async getGameMoves(gameId) {
        try {
            const moves = await this.database.query('moves', 'game_id', gameId);
            return moves.sort((a, b) => a.move_number - b.move_number);
        } catch (error) {
            throw new Error(`Ошибка получения ходов игры: ${error.message}`);
        }
    }

    async getNextMoveNumber(gameId) {
        try {
            const maxMove = await this.database.getMax('moves', 'game_id', gameId);
            return maxMove + 1;
        } catch (error) {
            // Если ходов нет, возвращаем 1
            return 1;
        }
    }

    serializeGameState(game) {
        return JSON.stringify(game.getBoardState());
    }

    serializeVisibleState(game) {
        return JSON.stringify(game.getVisibleState());
    }

    deserializeGame(gameData) {
        const game = new Game(gameData.rows, gameData.cols, gameData.mines);
        
        // Восстанавливаем состояние игрового поля
        const boardState = JSON.parse(gameData.board_state);
        const visibleState = JSON.parse(gameData.visible_state);
        
        game.restoreState(boardState, visibleState, gameData.game_over, gameData.game_won, gameData.opened_cells);
        
        return game;
    }
}

