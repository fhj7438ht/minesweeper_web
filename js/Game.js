
export class Game {
    static MINE = -1;
    static UNOPENED = -2;
    static FLAGGED = -3;

    constructor(rows = 9, cols = 9, mines = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.gameOver = false;
        this.gameWon = false;
        this.openedCells = 0;
        this.board = [];
        this.visible = [];
        this.initializeBoard();
    }


    initializeBoard() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.visible = Array(this.rows).fill(null).map(() => Array(this.cols).fill(Game.UNOPENED));
        this.placeMines();
        this.calculateNumbers();
    }

    placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);

            if (this.board[row][col] !== Game.MINE) {
                this.board[row][col] = Game.MINE;
                minesPlaced++;
            }
        }
    }

    calculateNumbers() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] !== Game.MINE) {
                    this.board[row][col] = this.countAdjacentMines(row, col);
                }
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;

                if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol] === Game.MINE) {
                    count++;
                }
            }
        }
        return count;
    }

    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }


    openCell(row, col) {
        if (!this.isValidCell(row, col) || this.gameOver || this.gameWon) {
            return false;
        }

        if (this.visible[row][col] !== Game.UNOPENED && this.visible[row][col] !== Game.FLAGGED) {
            return false;
        }

        if (this.visible[row][col] === Game.FLAGGED) {
            return false; // Нельзя открыть отмеченную ячейку
        }

        this.visible[row][col] = this.board[row][col];
        this.openedCells++;

        if (this.board[row][col] === Game.MINE) {
            this.gameOver = true;
            this.revealAllMines();
            return false;
        }

        if (this.board[row][col] === 0) {
            this.openAdjacentCells(row, col);
        }

        this.checkWinCondition();
        return true;
    }

    openAdjacentCells(row, col) { // Открытие соседних пустых ячеек
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;

                if (this.isValidCell(newRow, newCol) && this.visible[newRow][newCol] === Game.UNOPENED) {
                    this.visible[newRow][newCol] = this.board[newRow][newCol];
                    this.openedCells++;

                    if (this.board[newRow][newCol] === 0) {
                        this.openAdjacentCells(newRow, newCol);
                    }
                }
            }
        }
    }

    flagCell(row, col) { // Отметка ячейки флагом
        if (!this.isValidCell(row, col) || this.gameOver || this.gameWon) {
            return false;
        }

        if (this.visible[row][col] === Game.UNOPENED) {
            this.visible[row][col] = Game.FLAGGED;
            return true;
        } else if (this.visible[row][col] === Game.FLAGGED) {
            this.visible[row][col] = Game.UNOPENED;
            return true;
        }

        return false;
    }


    revealAllMines() { // Показать все мины (при проигрыше)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === Game.MINE) {
                    // Показываем мину, но сохраняем флаг если он был правильно установлен
                    if (this.visible[row][col] !== Game.FLAGGED) {
                        this.visible[row][col] = Game.MINE;
                    }
                }
            }
        }
    }

    checkWinCondition() {
        const totalCells = this.rows * this.cols;
        if (this.openedCells === totalCells - this.mines) {
            this.gameWon = true;
        }
    }

    getCellDisplay(row, col) {  // Получение состояния ячейки для отображения
        if (!this.isValidCell(row, col)) {
            return '?';
        }

        const cell = this.visible[row][col];

        switch (cell) {
            case Game.UNOPENED:
                return '.';
            case Game.FLAGGED:
                return 'M';
            case Game.MINE:
                return '*';
            case 0:
                return ' ';
            default:
                return String(cell);
        }
    }

    getBoardDisplay() { // Получение полного состояния поля для отображения
        const display = [];
        for (let row = 0; row < this.rows; row++) {
            display[row] = [];
            for (let col = 0; col < this.cols; col++) {
                display[row][col] = this.getCellDisplay(row, col);
            }
        }
        return display;
    }

    isGameOver() {
        return this.gameOver;
    }


    isGameWon() {
        return this.gameWon;
    }

    getDimensions() {
        return { rows: this.rows, cols: this.cols };
    }

    getMinesCount() {
        return this.mines;
    }

    getOpenedCellsCount() {
        return this.openedCells;
    }

    getBoardState() {
        return this.board;
    }

    getVisibleState() {
        return this.visible;
    }

    restoreState(boardState, visibleState, gameOver, gameWon, openedCells) {
        this.board = boardState;
        this.visible = visibleState;
        this.gameOver = gameOver;
        this.gameWon = gameWon;
        this.openedCells = openedCells;
    }

    // Создание игры с заданным состоянием (для воспроизведения)
    static createFromState(rows, cols, mines, boardState, visibleState, gameOver, gameWon, openedCells) {
        const game = new Game(rows, cols, mines);
        game.restoreState(boardState, visibleState, gameOver, gameWon, openedCells);
        return game;
    }
}

