// Chess Game Logic
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.kingPositions = { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } };
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.gameOver = false;
        this.checkState = null;
        this.lastMove = null;
        this.fiftyMoveCounter = 0;
        this.positionHistory = [];
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black', moved: false };
            board[6][i] = { type: 'pawn', color: 'white', moved: false };
        }

        // Rooks
        board[0][0] = board[0][7] = { type: 'rook', color: 'black', moved: false };
        board[7][0] = board[7][7] = { type: 'rook', color: 'white', moved: false };

        // Knights
        board[0][1] = board[0][6] = { type: 'knight', color: 'black', moved: false };
        board[7][1] = board[7][6] = { type: 'knight', color: 'white', moved: false };

        // Bishops
        board[0][2] = board[0][5] = { type: 'bishop', color: 'black', moved: false };
        board[7][2] = board[7][5] = { type: 'bishop', color: 'white', moved: false };

        // Queens
        board[0][3] = { type: 'queen', color: 'black', moved: false };
        board[7][3] = { type: 'queen', color: 'white', moved: false };

        // Kings
        board[0][4] = { type: 'king', color: 'black', moved: false };
        board[7][4] = { type: 'king', color: 'white', moved: false };

        return board;
    }

    getPiece(row, col) {
        return this.board[row]?.[col];
    }

    setPiece(row, col, piece) {
        this.board[row][col] = piece;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentPlayer) return [];

        let moves = [];
        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col);
                break;
            case 'king':
                moves = this.getKingMoves(row, col);
                break;
        }

        // Filter out moves that would leave king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));
    }

    getPawnMoves(row, col) {
        const moves = [];
        const piece = this.getPiece(row, col);
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Move forward one square
        if (this.isValidPosition(row + direction, col) && !this.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col, type: 'move' });

            // Move forward two squares from starting position
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col, type: 'move' });
            }
        }

        // Capture diagonally
        for (const colOffset of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (target && target.color !== piece.color) {
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

        return moves;
    }

    getRookMoves(row, col) {
        return this.getLinearMoves(row, col, [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    getBishopMoves(row, col) {
        return this.getLinearMoves(row, col, [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    getQueenMoves(row, col) {
        return this.getLinearMoves(row, col, [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    getLinearMoves(row, col, directions) {
        const moves = [];
        const piece = this.getPiece(row, col);

        for (const [dRow, dCol] of directions) {
            let newRow = row + dRow;
            let newCol = col + dCol;

            while (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else {
                    if (target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol, type: 'capture' });
                    }
                    break;
                }
                newRow += dRow;
                newCol += dCol;
            }
        }

        return moves;
    }

    getKnightMoves(row, col) {
        const moves = [];
        const piece = this.getPiece(row, col);
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
            }
        }

        return moves;
    }

    getKingMoves(row, col) {
        const moves = [];
        const piece = this.getPiece(row, col);
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dRow, dCol] of kingMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
            }
        }

        // Castling
        if (!piece.moved && !this.isKingInCheck(piece.color)) {
            // King side castling
            if (this.castlingRights[piece.color].kingSide) {
                const rook = this.getPiece(row, 7);
                if (rook && rook.type === 'rook' && !rook.moved &&
                    !this.getPiece(row, 5) && !this.getPiece(row, 6) &&
                    !this.isSquareUnderAttack(row, 5, piece.color) &&
                    !this.isSquareUnderAttack(row, 6, piece.color)) {
                    moves.push({ row, col: 6, type: 'castle-king' });
                }
            }

            // Queen side castling
            if (this.castlingRights[piece.color].queenSide) {
                const rook = this.getPiece(row, 0);
                if (rook && rook.type === 'rook' && !rook.moved &&
                    !this.getPiece(row, 1) && !this.getPiece(row, 2) && !this.getPiece(row, 3) &&
                    !this.isSquareUnderAttack(row, 2, piece.color) &&
                    !this.isSquareUnderAttack(row, 3, piece.color)) {
                    moves.push({ row, col: 2, type: 'castle-queen' });
                }
            }
        }

        return moves;
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
        // Simulate the move
        const piece = this.getPiece(fromRow, fromCol);
        const captured = this.getPiece(toRow, toCol);

        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        // Update king position if moving king
        let oldKingPos;
        if (piece.type === 'king') {
            oldKingPos = { ...this.kingPositions[piece.color] };
            this.kingPositions[piece.color] = { row: toRow, col: toCol };
        }

        const inCheck = this.isKingInCheck(piece.color);

        // Undo the move
        this.setPiece(fromRow, fromCol, piece);
        this.setPiece(toRow, toCol, captured);

        if (piece.type === 'king') {
            this.kingPositions[piece.color] = oldKingPos;
        }

        return inCheck;
    }

    isKingInCheck(color) {
        const kingPos = this.kingPositions[color];
        return this.isSquareUnderAttack(kingPos.row, kingPos.col, color);
    }

    isSquareUnderAttack(row, col, defendingColor) {
        const attackingColor = defendingColor === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === attackingColor) {
                    const moves = this.getPieceMoves(r, c, piece);
                    if (moves.some(move => move.row === row && move.col === col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getPieceMoves(row, col, piece) {
        switch (piece.type) {
            case 'pawn':
                return this.getPawnAttacks(row, col, piece);
            case 'rook':
                return this.getRookMoves(row, col);
            case 'knight':
                return this.getKnightMoves(row, col);
            case 'bishop':
                return this.getBishopMoves(row, col);
            case 'queen':
                return this.getQueenMoves(row, col);
            case 'king':
                return this.getKingAttacks(row, col);
            default:
                return [];
        }
    }

    getPawnAttacks(row, col, piece) {
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;

        for (const colOffset of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    getKingAttacks(row, col) {
        const moves = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dRow, dCol] of kingMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (this.isValidPosition(newRow, newCol)) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        const capturedPiece = this.getPiece(toRow, toCol);

        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece.type,
            color: piece.color,
            captured: capturedPiece,
            castling: null,
            enPassant: false,
            promotion: null
        };

        // Handle en passant capture
        if (piece.type === 'pawn' && this.enPassantTarget &&
            toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            const capturedPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            move.captured = this.getPiece(capturedPawnRow, toCol);
            this.capturedPieces[piece.color].push(move.captured);
            this.setPiece(capturedPawnRow, toCol, null);
            move.enPassant = true;
        }

        // Handle castling
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            const isKingSide = toCol > fromCol;
            const rookCol = isKingSide ? 7 : 0;
            const newRookCol = isKingSide ? 5 : 3;
            const rook = this.getPiece(fromRow, rookCol);

            this.setPiece(fromRow, newRookCol, rook);
            this.setPiece(fromRow, rookCol, null);
            rook.moved = true;

            move.castling = isKingSide ? 'king' : 'queen';
        }

        // Move the piece
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);
        piece.moved = true;

        // Update king position
        if (piece.type === 'king') {
            this.kingPositions[piece.color] = { row: toRow, col: toCol };
        }

        // Handle captured piece
        if (capturedPiece && !move.enPassant) {
            this.capturedPieces[piece.color].push(capturedPiece);
        }

        // Set en passant target
        this.enPassantTarget = null;
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = {
                row: (fromRow + toRow) / 2,
                col: fromCol
            };
        }

        // Update castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        }
        if (piece.type === 'rook') {
            if (fromCol === 0) this.castlingRights[piece.color].queenSide = false;
            if (fromCol === 7) this.castlingRights[piece.color].kingSide = false;
        }

        this.moveHistory.push(move);
        this.lastMove = { fromRow, fromCol, toRow, toCol };

        // Check for pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            return { promotion: true, row: toRow, col: toCol };
        }

        this.switchPlayer();
        return { promotion: false };
    }

    promotePawn(row, col, pieceType) {
        const piece = this.getPiece(row, col);
        piece.type = pieceType;

        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        lastMove.promotion = pieceType;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updateGameState();
    }

    updateGameState() {
        const opponent = this.currentPlayer;

        // Check if current player is in check
        if (this.isKingInCheck(opponent)) {
            this.checkState = opponent;

            // Check if it's checkmate
            if (this.isCheckmate(opponent)) {
                this.gameOver = true;
                return 'checkmate';
            }
            return 'check';
        } else {
            this.checkState = null;

            // Check for stalemate
            if (this.isStalemate(opponent)) {
                this.gameOver = true;
                return 'stalemate';
            }
        }

        return 'normal';
    }

    isCheckmate(color) {
        return !this.hasValidMoves(color);
    }

    isStalemate(color) {
        return !this.isKingInCheck(color) && !this.hasValidMoves(color);
    }

    hasValidMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    reset() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.kingPositions = { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } };
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.gameOver = false;
        this.checkState = null;
        this.lastMove = null;
    }
}
