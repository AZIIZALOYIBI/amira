/**
 * Chess Game Logic - Class-based implementation
 * Supports: all standard piece moves, castling, en passant, pawn promotion,
 * check/checkmate/stalemate detection, and move history.
 */

class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.gameOver = false;
        this.checkState = null;
        this.validMoves = [];
        this.lastMove = null;
        this.capturedPieces = { white: [], black: [] };
        this.moveHistory = [];
        this.gameStateHistory = []; // Full state history for undo/redo
        this.redoStack = []; // Stack for redo functionality
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };

        this.initBoard();
        this.saveState(); // Save initial state
    }

    initBoard() {
        // Initialize 8x8 board
        this.board = [
            // Row 0 - Black back rank
            [
                { type: 'rook', color: 'black' },
                { type: 'knight', color: 'black' },
                { type: 'bishop', color: 'black' },
                { type: 'queen', color: 'black' },
                { type: 'king', color: 'black' },
                { type: 'bishop', color: 'black' },
                { type: 'knight', color: 'black' },
                { type: 'rook', color: 'black' }
            ],
            // Row 1 - Black pawns
            Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
            // Rows 2-5 - Empty
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            // Row 6 - White pawns
            Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
            // Row 7 - White back rank
            [
                { type: 'rook', color: 'white' },
                { type: 'knight', color: 'white' },
                { type: 'bishop', color: 'white' },
                { type: 'queen', color: 'white' },
                { type: 'king', color: 'white' },
                { type: 'bishop', color: 'white' },
                { type: 'knight', color: 'white' },
                { type: 'rook', color: 'white' }
            ]
        ];

        this.currentPlayer = 'white';
        this.gameOver = false;
        this.checkState = null;
        this.validMoves = [];
        this.lastMove = null;
        this.capturedPieces = { white: [], black: [] };
        this.moveHistory = [];
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentPlayer) return [];

        const moves = [];

        switch (piece.type) {
            case 'pawn':
                this.getPawnMoves(row, col, piece.color, moves);
                break;
            case 'rook':
                this.getSlidingMoves(row, col, piece.color, moves, [[0,1],[0,-1],[1,0],[-1,0]]);
                break;
            case 'bishop':
                this.getSlidingMoves(row, col, piece.color, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]);
                break;
            case 'queen':
                this.getSlidingMoves(row, col, piece.color, moves, [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]);
                break;
            case 'knight':
                this.getKnightMoves(row, col, piece.color, moves);
                break;
            case 'king':
                this.getKingMoves(row, col, piece.color, moves);
                break;
        }

        // Filter out moves that would leave king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
    }

    getPawnMoves(row, col, color, moves) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Move forward one square
        if (!this.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col, type: 'move' });

            // Move forward two squares from starting position
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col, type: 'move' });
            }
        }

        // Capture diagonally
        for (const dc of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dc;
            const target = this.getPiece(newRow, newCol);

            if (target && target.color !== color) {
                moves.push({ row: newRow, col: newCol, type: 'capture' });
            }

            // En passant
            if (this.enPassantTarget &&
                this.enPassantTarget.row === newRow &&
                this.enPassantTarget.col === newCol) {
                moves.push({ row: newRow, col: newCol, type: 'enpassant' });
            }
        }
    }

    getSlidingMoves(row, col, color, moves, directions) {
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = this.getPiece(r, c);

                if (target) {
                    if (target.color !== color) {
                        moves.push({ row: r, col: c, type: 'capture' });
                    }
                    break;
                }

                moves.push({ row: r, col: c, type: 'move' });
                r += dr;
                c += dc;
            }
        }
    }

    getKnightMoves(row, col, color, moves) {
        const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];

        for (const [dr, dc] of offsets) {
            const r = row + dr;
            const c = col + dc;

            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = this.getPiece(r, c);
                if (!target || target.color !== color) {
                    moves.push({ row: r, col: c, type: target ? 'capture' : 'move' });
                }
            }
        }
    }

    getKingMoves(row, col, color, moves) {
        const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

        for (const [dr, dc] of offsets) {
            const r = row + dr;
            const c = col + dc;

            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = this.getPiece(r, c);
                if (!target || target.color !== color) {
                    moves.push({ row: r, col: c, type: target ? 'capture' : 'move' });
                }
            }
        }

        // Castling
        if (!this.isInCheck(color)) {
            const backRank = color === 'white' ? 7 : 0;

            if (row === backRank && col === 4) {
                // Kingside castling
                if (this.castlingRights[color].kingside &&
                    !this.getPiece(backRank, 5) &&
                    !this.getPiece(backRank, 6) &&
                    !this.isSquareUnderAttack(backRank, 5, color) &&
                    !this.isSquareUnderAttack(backRank, 6, color)) {
                    moves.push({ row: backRank, col: 6, type: 'castle-kingside' });
                }

                // Queenside castling
                if (this.castlingRights[color].queenside &&
                    !this.getPiece(backRank, 3) &&
                    !this.getPiece(backRank, 2) &&
                    !this.getPiece(backRank, 1) &&
                    !this.isSquareUnderAttack(backRank, 3, color) &&
                    !this.isSquareUnderAttack(backRank, 2, color)) {
                    moves.push({ row: backRank, col: 2, type: 'castle-queenside' });
                }
            }
        }
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return { success: false };

        const move = this.validMoves.find(m => m.row === toRow && m.col === toCol);
        if (!move) return { success: false };

        // Handle en passant capture
        if (move.type === 'enpassant') {
            const capturedRow = fromRow;
            const capturedPiece = this.getPiece(capturedRow, toCol);
            if (capturedPiece) {
                this.capturedPieces[this.currentPlayer].push(capturedPiece);
                this.board[capturedRow][toCol] = null;
            }
        }

        // Handle castling
        if (move.type === 'castle-kingside') {
            const backRank = piece.color === 'white' ? 7 : 0;
            this.board[backRank][5] = this.board[backRank][7];
            this.board[backRank][7] = null;
        } else if (move.type === 'castle-queenside') {
            const backRank = piece.color === 'white' ? 7 : 0;
            this.board[backRank][3] = this.board[backRank][0];
            this.board[backRank][0] = null;
        }

        // Capture regular piece
        const capturedPiece = this.getPiece(toRow, toCol);
        if (capturedPiece && move.type === 'capture') {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }

        // Move the piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Update castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }
        if (piece.type === 'rook') {
            if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
            if (fromCol === 7) this.castlingRights[piece.color].kingside = false;
        }

        // Update en passant target
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = {
                row: (fromRow + toRow) / 2,
                col: fromCol
            };
        } else {
            this.enPassantTarget = null;
        }

        // Record move
        this.lastMove = {
            fromRow, fromCol, toRow, toCol,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece.type,
            color: piece.color,
            captured: capturedPiece
        };

        this.moveHistory.push(this.lastMove);

        // Check for pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            return { success: true, promotion: true, row: toRow, col: toCol };
        }

        this.switchPlayer();
        this.saveState(); // Save state after move
        return { success: true };
    }

    promotePawn(row, col, newType) {
        const piece = this.getPiece(row, col);
        if (piece && piece.type === 'pawn') {
            this.board[row][col] = { type: newType, color: piece.color };
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;

        return this.isSquareUnderAttack(kingPos.row, kingPos.col, color);
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isSquareUnderAttack(row, col, byColor) {
        const opponent = byColor === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === opponent) {
                    if (this.canPieceAttackSquare(r, c, piece, row, col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    canPieceAttackSquare(fromRow, fromCol, piece, toRow, toCol) {
        const dr = toRow - fromRow;
        const dc = toCol - fromCol;

        switch (piece.type) {
            case 'pawn': {
                const direction = piece.color === 'white' ? -1 : 1;
                return dr === direction && Math.abs(dc) === 1;
            }
            case 'knight':
                return (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
                       (Math.abs(dr) === 1 && Math.abs(dc) === 2);
            case 'king':
                return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
            case 'rook':
                if (dr !== 0 && dc !== 0) return false;
                return this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                if (Math.abs(dr) !== Math.abs(dc)) return false;
                return this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'queen':
                if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
                return this.isPathClear(fromRow, fromCol, toRow, toCol);
        }

        return false;
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const dr = Math.sign(toRow - fromRow);
        const dc = Math.sign(toCol - fromCol);
        let r = fromRow + dr;
        let c = fromCol + dc;

        while (r !== toRow || c !== toCol) {
            if (this.getPiece(r, c)) return false;
            r += dr;
            c += dc;
        }

        return true;
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Simulate the move
        const originalPiece = this.getPiece(fromRow, fromCol);
        const targetPiece = this.getPiece(toRow, toCol);
        const originalEnPassant = this.enPassantTarget;

        // Make temporary move
        this.board[toRow][toCol] = originalPiece;
        this.board[fromRow][fromCol] = null;

        // Handle en passant in simulation
        let enPassantCapture = null;
        if (originalPiece.type === 'pawn' && originalEnPassant &&
            toRow === originalEnPassant.row && toCol === originalEnPassant.col) {
            enPassantCapture = this.getPiece(fromRow, toCol);
            this.board[fromRow][toCol] = null;
        }

        const inCheck = this.isInCheck(color);

        // Restore board
        this.board[fromRow][fromCol] = originalPiece;
        this.board[toRow][toCol] = targetPiece;
        if (enPassantCapture) {
            this.board[fromRow][toCol] = enPassantCapture;
        }
        this.enPassantTarget = originalEnPassant;

        return inCheck;
    }

    updateGameState() {
        const inCheck = this.isInCheck(this.currentPlayer);
        const hasLegalMoves = this.hasAnyLegalMoves(this.currentPlayer);

        if (inCheck) {
            this.checkState = this.currentPlayer;
            if (!hasLegalMoves) {
                this.gameOver = true;
                return 'checkmate';
            }
            return 'check';
        } else {
            this.checkState = null;
            if (!hasLegalMoves) {
                this.gameOver = true;
                return 'stalemate';
            }
        }

        return 'normal';
    }

    hasAnyLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }

    reset() {
        this.initBoard();
        this.gameStateHistory = [];
        this.redoStack = [];
        this.saveState();
    }

    // Save current game state for undo functionality
    saveState() {
        const state = {
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            checkState: this.checkState,
            lastMove: this.lastMove ? JSON.parse(JSON.stringify(this.lastMove)) : null,
            capturedPieces: JSON.parse(JSON.stringify(this.capturedPieces)),
            moveHistory: JSON.parse(JSON.stringify(this.moveHistory)),
            enPassantTarget: this.enPassantTarget ? JSON.parse(JSON.stringify(this.enPassantTarget)) : null,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights))
        };
        this.gameStateHistory.push(state);
        // Clear redo stack when a new move is made
        this.redoStack = [];
    }

    // Restore a game state
    restoreState(state) {
        this.board = JSON.parse(JSON.stringify(state.board));
        this.currentPlayer = state.currentPlayer;
        this.gameOver = state.gameOver;
        this.checkState = state.checkState;
        this.lastMove = state.lastMove ? JSON.parse(JSON.stringify(state.lastMove)) : null;
        this.capturedPieces = JSON.parse(JSON.stringify(state.capturedPieces));
        this.moveHistory = JSON.parse(JSON.stringify(state.moveHistory));
        this.enPassantTarget = state.enPassantTarget ? JSON.parse(JSON.stringify(state.enPassantTarget)) : null;
        this.castlingRights = JSON.parse(JSON.stringify(state.castlingRights));
    }

    // Undo last move
    undo() {
        if (this.gameStateHistory.length <= 1) return false; // Can't undo initial state

        // Save current state to redo stack
        const currentState = this.gameStateHistory.pop();
        this.redoStack.push(currentState);

        // Restore previous state
        const previousState = this.gameStateHistory[this.gameStateHistory.length - 1];
        this.restoreState(previousState);

        return true;
    }

    // Redo previously undone move
    redo() {
        if (this.redoStack.length === 0) return false;

        const state = this.redoStack.pop();
        this.gameStateHistory.push(state);
        this.restoreState(state);

        return true;
    }

    // Export game to PGN format
    toPGN(whitePlayer = 'اللاعب الأبيض', blackPlayer = 'اللاعب الأسود') {
        let pgn = `[Event "لعبة شطرنج"]\n`;
        pgn += `[Site "Amira Chess"]\n`;
        pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
        pgn += `[White "${whitePlayer}"]\n`;
        pgn += `[Black "${blackPlayer}"]\n`;
        pgn += `[Result "*"]\n\n`;

        // Add moves
        for (let i = 0; i < this.moveHistory.length; i++) {
            if (i % 2 === 0) {
                pgn += `${Math.floor(i / 2) + 1}. `;
            }
            pgn += this.formatMoveForPGN(this.moveHistory[i]) + ' ';
            if (i % 2 === 1) {
                pgn += '\n';
            }
        }

        return pgn;
    }

    formatMoveForPGN(move) {
        const files = 'abcdefgh';
        const from = files[move.from.col] + (8 - move.from.row);
        const to = files[move.to.col] + (8 - move.to.row);

        if (move.castling) {
            return move.castling === 'king' ? 'O-O' : 'O-O-O';
        }

        let notation = '';
        const pieceSymbols = { pawn: '', rook: 'R', knight: 'N', bishop: 'B', queen: 'Q', king: 'K' };
        notation = pieceSymbols[move.piece];
        if (move.captured) notation += 'x';
        notation += to;
        if (move.promotion) {
            notation += '=' + pieceSymbols[move.promotion].toUpperCase();
        }

        return notation;
    }

    // Save game to localStorage
    saveToLocalStorage(slot = 'autosave') {
        const gameData = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory,
            capturedPieces: this.capturedPieces,
            enPassantTarget: this.enPassantTarget,
            castlingRights: this.castlingRights,
            gameOver: this.gameOver,
            checkState: this.checkState,
            timestamp: new Date().toISOString()
        };

        try {
            localStorage.setItem(`amira_chess_${slot}`, JSON.stringify(gameData));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    // Load game from localStorage
    loadFromLocalStorage(slot = 'autosave') {
        try {
            const data = localStorage.getItem(`amira_chess_${slot}`);
            if (!data) return false;

            const gameData = JSON.parse(data);
            this.board = gameData.board;
            this.currentPlayer = gameData.currentPlayer;
            this.moveHistory = gameData.moveHistory;
            this.capturedPieces = gameData.capturedPieces;
            this.enPassantTarget = gameData.enPassantTarget;
            this.castlingRights = gameData.castlingRights;
            this.gameOver = gameData.gameOver;
            this.checkState = gameData.checkState;

            // Restore last move if it exists in the move history
            if (this.moveHistory.length > 0) {
                this.lastMove = this.moveHistory[this.moveHistory.length - 1];
            } else {
                this.lastMove = null;
            }

            // Rebuild state history
            this.gameStateHistory = [];
            this.redoStack = [];
            this.saveState();

            return true;
        } catch (e) {
            console.error('Failed to load game:', e);
            return false;
        }
    }

    // Get list of saved games
    static getSavedGames() {
        const games = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('amira_chess_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    games.push({
                        slot: key.replace('amira_chess_', ''),
                        timestamp: data.timestamp,
                        moves: data.moveHistory.length
                    });
                } catch (e) {
                    console.error('Error reading saved game:', e);
                }
            }
        }
        return games;
    }
}
