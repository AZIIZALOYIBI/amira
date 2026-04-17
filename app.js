// UI Controller
class ChessUI {
    constructor() {
        this.game = new ChessGame();
        this.boardElement = document.getElementById('chessBoard');
        this.selectedSquare = null;
        this.soundEnabled = true;
        this.highlightEnabled = true;
        this.timerEnabled = false;
        this.flipped = false;
        this.timers = { white: 600, black: 600 }; // 10 minutes in seconds
        this.timerInterval = null;
        this.playerNames = { white: 'اللاعب الأبيض', black: 'اللاعب الأسود' };
        this.gameMode = 'classic';

        this.pieceSymbols = {
            white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
        };

        this.initSetup();
    }

    initSetup() {
        this.attachSetupListeners();
    }

    attachSetupListeners() {
        // Game setup modal
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());

        // Mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.gameMode = option.dataset.mode;
            });
        });
    }

    startGame() {
        // Get player names
        this.playerNames.white = document.getElementById('whitePlayerName').value || 'اللاعب الأبيض';
        this.playerNames.black = document.getElementById('blackPlayerName').value || 'اللاعب الأسود';

        // Set timer based on game mode
        const timers = {
            classic: 600,  // 10 minutes
            rapid: 300,    // 5 minutes
            blitz: 180,    // 3 minutes
            unlimited: 0   // No timer
        };

        this.timers.white = timers[this.gameMode];
        this.timers.black = timers[this.gameMode];
        this.timerEnabled = this.gameMode !== 'unlimited';

        // Update player name displays
        document.getElementById('whitePlayerNameDisplay').textContent = this.playerNames.white;
        document.getElementById('blackPlayerNameDisplay').textContent = this.playerNames.black;

        // Hide modal
        document.getElementById('gameSetupModal').classList.remove('active');

        // Try to load autosaved game
        const loadAutosave = confirm('هل تريد استعادة اللعبة المحفوظة تلقائياً؟');
        if (loadAutosave && this.game.loadFromLocalStorage('autosave')) {
            this.renderBoard();
            this.updateGameStatus();
            this.updateTimerDisplay();
            if (this.timerEnabled) {
                this.startTimer();
            }
        } else {
            // Initialize new game
            this.init();
        }
    }

    init() {
        // Load saved theme
        const savedTheme = localStorage.getItem('chess_theme');
        if (savedTheme) {
            document.getElementById('themeSelector').value = savedTheme;
            this.changeTheme(savedTheme);
        }

        this.renderBoard();
        this.attachEventListeners();
        this.updateGameStatus();
        this.updateTimerDisplay();
        if (this.timerEnabled) {
            this.startTimer();
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const displayRow = this.flipped ? 7 - row : row;
                const displayCol = this.flipped ? 7 - col : col;

                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = displayRow;
                square.dataset.col = displayCol;

                // Add coordinate labels
                if (col === 0) {
                    const rankLabel = document.createElement('span');
                    rankLabel.className = 'square-label rank';
                    rankLabel.textContent = 8 - displayRow;
                    square.appendChild(rankLabel);
                }
                if (row === 7) {
                    const fileLabel = document.createElement('span');
                    fileLabel.className = 'square-label file';
                    fileLabel.textContent = String.fromCharCode(97 + displayCol);
                    square.appendChild(fileLabel);
                }

                // Add piece if present
                const piece = this.game.getPiece(displayRow, displayCol);
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                    pieceElement.draggable = piece.color === this.game.currentPlayer && !this.game.gameOver;
                    square.appendChild(pieceElement);
                }

                // Highlight last move
                if (this.game.lastMove &&
                    ((displayRow === this.game.lastMove.fromRow && displayCol === this.game.lastMove.fromCol) ||
                     (displayRow === this.game.lastMove.toRow && displayCol === this.game.lastMove.toCol))) {
                    square.classList.add('last-move');
                }

                // Highlight king in check
                if (this.game.checkState && piece && piece.type === 'king' && piece.color === this.game.checkState) {
                    square.classList.add('in-check');
                }

                this.boardElement.appendChild(square);
            }
        }

        this.updateCapturedPieces();
        this.updateMoveHistory();
    }

    attachEventListeners() {
        // Board click events
        this.boardElement.addEventListener('click', (e) => this.handleSquareClick(e));

        // Drag and drop
        this.boardElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
        this.boardElement.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.boardElement.addEventListener('drop', (e) => this.handleDrop(e));

        // Control buttons
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        document.getElementById('redoBtn').addEventListener('click', () => this.redoMove());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('flipBoardBtn').addEventListener('click', () => this.flipBoard());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveGame());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadGame());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportPGN());

        // Settings
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
        document.getElementById('highlightToggle').addEventListener('change', (e) => {
            this.highlightEnabled = e.target.checked;
            if (!this.highlightEnabled) {
                this.clearHighlights();
            }
        });
        document.getElementById('timerToggle').addEventListener('change', (e) => {
            this.timerEnabled = e.target.checked;
            if (this.timerEnabled) {
                this.startTimer();
            } else {
                this.stopTimer();
            }
        });
        document.getElementById('themeSelector').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        this.undoMove();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redoMove();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveGame();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.loadGame();
                        break;
                }
            }
            // Arrow keys for board navigation
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.undoMove();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.redoMove();
            }
        });
    }

    changeTheme(theme) {
        document.body.classList.remove('theme-classic', 'theme-blue', 'theme-green', 'theme-purple', 'theme-red');
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        localStorage.setItem('chess_theme', theme);
        this.renderBoard(); // Re-render to apply new colors
    }

    handleSquareClick(e) {
        if (this.game.gameOver) return;

        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        // If a square is already selected
        if (this.selectedSquare) {
            const validMove = this.game.validMoves.find(m => m.row === row && m.col === col);
            if (validMove) {
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            } else {
                // Check if clicking another piece of the same color
                const piece = this.game.getPiece(row, col);
                if (piece && piece.color === this.game.currentPlayer) {
                    this.selectSquare(row, col);
                } else {
                    this.deselectSquare();
                }
            }
        } else {
            // Select a new square
            const piece = this.game.getPiece(row, col);
            if (piece && piece.color === this.game.currentPlayer) {
                this.selectSquare(row, col);
            }
        }
    }

    selectSquare(row, col) {
        this.deselectSquare();

        this.selectedSquare = { row, col };
        this.game.validMoves = this.game.getValidMoves(row, col);

        const square = this.getSquareElement(row, col);
        if (square) {
            square.classList.add('selected');
        }

        if (this.highlightEnabled) {
            this.highlightValidMoves();
        }
    }

    deselectSquare() {
        this.clearHighlights();
        this.selectedSquare = null;
        this.game.validMoves = [];
    }

    highlightValidMoves() {
        this.game.validMoves.forEach(move => {
            const square = this.getSquareElement(move.row, move.col);
            if (square) {
                if (move.type === 'capture' || move.type === 'enpassant') {
                    square.classList.add('valid-capture');
                } else {
                    square.classList.add('valid-move');
                }
            }
        });
    }

    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'valid-capture');
        });
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const result = this.game.makeMove(fromRow, fromCol, toRow, toCol);

        if (result.promotion) {
            this.showPromotionDialog(result.row, result.col);
        } else {
            this.playSound('move');
            this.renderBoard();
            this.updateGameStatus();
            this.deselectSquare();
            // Auto-save after each move
            this.game.saveToLocalStorage('autosave');
        }
    }

    showPromotionDialog(row, col) {
        const dialog = document.getElementById('promotionDialog');
        const piecesContainer = document.getElementById('promotionPieces');

        piecesContainer.innerHTML = '';
        const piece = this.game.getPiece(row, col);
        const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];

        promotionPieces.forEach(type => {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'promotion-piece';
            pieceElement.textContent = this.pieceSymbols[piece.color][type];
            pieceElement.addEventListener('click', () => {
                this.game.promotePawn(row, col, type);
                dialog.classList.remove('active');
                this.game.switchPlayer();
                this.playSound('move');
                this.renderBoard();
                this.updateGameStatus();
                this.deselectSquare();
            });
            piecesContainer.appendChild(pieceElement);
        });

        dialog.classList.add('active');
    }

    handleDragStart(e) {
        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = this.game.getPiece(row, col);

        if (piece && piece.color === this.game.currentPlayer && !this.game.gameOver) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
            this.selectSquare(row, col);

            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        } else {
            e.preventDefault();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();

        const square = e.target.closest('.square');
        if (!square) return;

        const toRow = parseInt(square.dataset.row);
        const toCol = parseInt(square.dataset.col);

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const validMove = this.game.validMoves.find(m => m.row === toRow && m.col === toCol);

            if (validMove) {
                this.makeMove(data.row, data.col, toRow, toCol);
            }
        } catch (error) {
            console.error('Drop error:', error);
        }

        document.querySelectorAll('.piece').forEach(p => p.classList.remove('dragging'));
        this.deselectSquare();
    }

    updateGameStatus() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const gameMessageElement = document.getElementById('gameMessage');

        const playerName = this.playerNames[this.game.currentPlayer];
        currentPlayerElement.textContent = playerName;

        const state = this.game.updateGameState();

        if (state === 'checkmate') {
            const winner = this.game.currentPlayer === 'white' ? this.playerNames.black : this.playerNames.white;
            gameMessageElement.textContent = `كش ملك! فاز ${winner}`;
            this.playSound('checkmate');
            this.stopTimer();
            this.showVictory(winner, 'بالكش مات');
        } else if (state === 'check') {
            gameMessageElement.textContent = 'كش!';
            this.playSound('check');
        } else if (state === 'stalemate') {
            gameMessageElement.textContent = 'تعادل - طريق مسدود';
            this.playSound('stalemate');
            this.stopTimer();
            this.showVictory('تعادل', 'طريق مسدود');
        } else {
            gameMessageElement.textContent = '';
        }
    }

    showVictory(winner, reason) {
        setTimeout(() => {
            const victoryOverlay = document.getElementById('victoryOverlay');
            const victoryMessage = document.getElementById('victoryMessage');

            if (winner === 'تعادل') {
                victoryMessage.textContent = `انتهت اللعبة بالتعادل - ${reason}`;
            } else {
                victoryMessage.textContent = `🎉 فاز ${winner} ${reason}! 🎉`;
            }

            victoryOverlay.classList.add('active');
        }, 500);
    }

    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('whiteCaptured');
        const blackCaptured = document.getElementById('blackCaptured');

        whiteCaptured.innerHTML = this.game.capturedPieces.white
            .map(piece => `<span class="captured-piece">${this.pieceSymbols[piece.color][piece.type]}</span>`)
            .join('');

        blackCaptured.innerHTML = this.game.capturedPieces.black
            .map(piece => `<span class="captured-piece">${this.pieceSymbols[piece.color][piece.type]}</span>`)
            .join('');
    }

    updateMoveHistory() {
        const movesList = document.getElementById('movesList');
        movesList.innerHTML = '';

        for (let i = 0; i < this.game.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.game.moveHistory[i];
            const blackMove = this.game.moveHistory[i + 1];

            const entry = document.createElement('div');
            entry.className = 'move-entry';

            const moveText = `
                <span class="move-number">${moveNumber}.</span>
                <span>${this.formatMove(whiteMove)}</span>
                ${blackMove ? `<span>${this.formatMove(blackMove)}</span>` : ''}
            `;

            entry.innerHTML = moveText;
            movesList.appendChild(entry);
        }

        movesList.scrollTop = movesList.scrollHeight;
    }

    formatMove(move) {
        const files = 'abcdefgh';
        const from = files[move.from.col] + (8 - move.from.row);
        const to = files[move.to.col] + (8 - move.to.row);

        let notation = '';
        if (move.castling) {
            notation = move.castling === 'king' ? 'O-O' : 'O-O-O';
        } else {
            const pieceSymbol = this.pieceSymbols[move.color][move.piece];
            notation = pieceSymbol;
            if (move.captured) notation += '×';
            notation += to;
            if (move.promotion) {
                notation += '=' + this.pieceSymbols[move.color][move.promotion];
            }
        }

        return notation;
    }

    getSquareElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        // Create simple beep sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        let frequency = 440;
        let duration = 0.1;

        switch (type) {
            case 'move':
                frequency = 523;
                duration = 0.1;
                break;
            case 'capture':
                frequency = 659;
                duration = 0.15;
                break;
            case 'check':
                frequency = 784;
                duration = 0.2;
                break;
            case 'checkmate':
                frequency = 880;
                duration = 0.5;
                break;
        }

        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    startTimer() {
        if (this.timerInterval) return;

        this.timerInterval = setInterval(() => {
            if (this.game.gameOver) {
                this.stopTimer();
                return;
            }

            const currentTimer = this.game.currentPlayer;
            this.timers[currentTimer]--;

            if (this.timers[currentTimer] <= 0) {
                this.timers[currentTimer] = 0;
                this.handleTimeout(currentTimer);
                this.stopTimer();
            }

            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const whiteTimer = document.getElementById('whiteTimer');
        const blackTimer = document.getElementById('blackTimer');

        whiteTimer.textContent = this.formatTime(this.timers.white);
        blackTimer.textContent = this.formatTime(this.timers.black);

        // Add warning class when time is low
        whiteTimer.className = 'timer';
        blackTimer.className = 'timer';

        if (this.timers.white < 60) whiteTimer.classList.add('danger');
        else if (this.timers.white < 180) whiteTimer.classList.add('warning');

        if (this.timers.black < 60) blackTimer.classList.add('danger');
        else if (this.timers.black < 180) blackTimer.classList.add('warning');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleTimeout(player) {
        const winner = player === 'white' ? this.playerNames.black : this.playerNames.white;
        document.getElementById('gameMessage').textContent = `انتهى الوقت! فاز ${winner}`;
        this.game.gameOver = true;
        this.showVictory(winner, 'بانتهاء الوقت');
    }

    flipBoard() {
        this.flipped = !this.flipped;
        this.renderBoard();
        if (this.selectedSquare) {
            this.selectSquare(this.selectedSquare.row, this.selectedSquare.col);
        }
    }

    newGame() {
        if (confirm('هل تريد بدء لعبة جديدة؟')) {
            location.reload();
        }
    }

    resetGame() {
        this.game.reset();
        this.selectedSquare = null;
        this.timers = { white: 600, black: 600 };
        this.stopTimer();
        if (this.timerEnabled) {
            this.startTimer();
        }
        this.renderBoard();
        this.updateGameStatus();
        this.updateTimerDisplay();
    }

    undoMove() {
        if (this.game.undo()) {
            this.playSound('move');
            this.renderBoard();
            this.updateGameStatus();
            this.deselectSquare();
        }
    }

    redoMove() {
        if (this.game.redo()) {
            this.playSound('move');
            this.renderBoard();
            this.updateGameStatus();
            this.deselectSquare();
        }
    }

    saveGame() {
        const slot = prompt('اسم حفظ اللعبة:', 'game_' + Date.now());
        if (slot) {
            if (this.game.saveToLocalStorage(slot)) {
                alert('✅ تم حفظ اللعبة بنجاح!');
            } else {
                alert('❌ فشل حفظ اللعبة');
            }
        }
    }

    loadGame() {
        const games = ChessGame.getSavedGames();
        if (games.length === 0) {
            alert('لا توجد ألعاب محفوظة');
            return;
        }

        let message = 'اختر لعبة للتحميل:\n\n';
        games.forEach((game, index) => {
            message += `${index + 1}. ${game.slot} - ${game.moves} حركة\n`;
        });

        const choice = prompt(message + '\nأدخل رقم اللعبة:');
        if (choice) {
            const index = parseInt(choice) - 1;
            if (index >= 0 && index < games.length) {
                if (this.game.loadFromLocalStorage(games[index].slot)) {
                    this.renderBoard();
                    this.updateGameStatus();
                    alert('✅ تم تحميل اللعبة بنجاح!');
                } else {
                    alert('❌ فشل تحميل اللعبة');
                }
            }
        }
    }

    exportPGN() {
        const pgn = this.game.toPGN(this.playerNames.white, this.playerNames.black);
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amira_chess_${Date.now()}.pgn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('✅ تم تصدير اللعبة بصيغة PGN!');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const ui = new ChessUI();
});
