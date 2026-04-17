/**
 * Chess AI Engine
 * Implements Minimax algorithm with Alpha-Beta pruning
 * Supports multiple difficulty levels
 */

class ChessAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getDepthByDifficulty(difficulty);
        this.positionCount = 0;

        // Piece values for evaluation
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };

        // Position bonuses for pieces (encouraging good piece placement)
        this.pawnTable = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ];

        this.knightTable = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ];

        this.bishopTable = [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ];

        this.rookTable = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ];

        this.queenTable = [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ];

        this.kingTable = [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ];
    }

    getDepthByDifficulty(difficulty) {
        const depths = {
            easy: 1,
            medium: 3,
            hard: 4
        };
        return depths[difficulty] || 3;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.maxDepth = this.getDepthByDifficulty(difficulty);
    }

    /**
     * Get the best move for the AI
     * @param {ChessGame} game - The chess game instance
     * @param {string} color - The color AI is playing ('white' or 'black')
     * @returns {Object|null} - Best move {fromRow, fromCol, toRow, toCol}
     */
    getBestMove(game, color) {
        this.positionCount = 0;
        const startTime = Date.now();

        let bestMove = null;
        let bestValue = -Infinity;
        const alpha = -Infinity;
        const beta = Infinity;

        // Get all possible moves
        const allMoves = this.getAllPossibleMoves(game, color);

        if (allMoves.length === 0) {
            return null;
        }

        // Easy mode: sometimes make random moves
        if (this.difficulty === 'easy' && Math.random() < 0.3) {
            return allMoves[Math.floor(Math.random() * allMoves.length)];
        }

        // Evaluate each move
        for (const move of allMoves) {
            const moveValue = this.evaluateMove(game, move, color, 0, alpha, beta);

            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }

        const endTime = Date.now();
        console.log(`AI evaluated ${this.positionCount} positions in ${endTime - startTime}ms`);
        console.log(`Best move value: ${bestValue}`);

        return bestMove;
    }

    /**
     * Evaluate a move using minimax with alpha-beta pruning
     */
    evaluateMove(game, move, color, depth, alpha, beta) {
        // Save game state
        const savedState = this.saveGameState(game);

        // Make the move
        const piece = game.getPiece(move.fromRow, move.fromCol);
        const capturedPiece = game.getPiece(move.toRow, move.toCol);
        game.board[move.toRow][move.toCol] = piece;
        game.board[move.fromRow][move.fromCol] = null;

        // Handle pawn promotion (auto-promote to queen)
        if (piece.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            game.board[move.toRow][move.toCol] = { type: 'queen', color: piece.color };
        }

        // Switch current player for proper move validation during search
        const opponent = color === 'white' ? 'black' : 'white';
        game.currentPlayer = opponent;

        let value;

        // Check if game is over or max depth reached
        if (depth >= this.maxDepth || this.isGameOver(game)) {
            value = this.evaluatePosition(game, color);
        } else {
            // Minimax with alpha-beta pruning
            const opponentMoves = this.getAllPossibleMoves(game, opponent);

            if (opponentMoves.length === 0) {
                value = this.evaluatePosition(game, color);
            } else {
                value = Infinity; // Minimizing for opponent

                for (const opponentMove of opponentMoves) {
                    const opponentValue = -this.evaluateMove(
                        game,
                        opponentMove,
                        opponent,
                        depth + 1,
                        -beta,
                        -alpha
                    );

                    value = Math.min(value, opponentValue);
                    beta = Math.min(beta, value);

                    if (beta <= alpha) {
                        break; // Alpha-beta pruning
                    }
                }

                value = -value;
            }
        }

        // Restore game state
        this.restoreGameState(game, savedState);
        this.positionCount++;

        return value;
    }

    /**
     * Evaluate the current board position
     */
    evaluatePosition(game, color) {
        let score = 0;

        // Check for checkmate or stalemate
        if (this.isCheckmate(game, color)) {
            return -Infinity;
        }
        if (this.isCheckmate(game, color === 'white' ? 'black' : 'white')) {
            return Infinity;
        }
        if (this.isStalemate(game)) {
            return 0;
        }

        // Evaluate material and position
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (!piece) continue;

                const pieceValue = this.pieceValues[piece.type];
                const positionBonus = this.getPositionBonus(piece.type, row, col, piece.color);
                const totalValue = pieceValue + positionBonus;

                if (piece.color === color) {
                    score += totalValue;
                } else {
                    score -= totalValue;
                }
            }
        }

        return score;
    }

    /**
     * Get position bonus for a piece
     */
    getPositionBonus(pieceType, row, col, color) {
        let table;

        switch (pieceType) {
            case 'pawn': table = this.pawnTable; break;
            case 'knight': table = this.knightTable; break;
            case 'bishop': table = this.bishopTable; break;
            case 'rook': table = this.rookTable; break;
            case 'queen': table = this.queenTable; break;
            case 'king': table = this.kingTable; break;
            default: return 0;
        }

        // Flip table for black pieces
        const tableRow = color === 'white' ? row : 7 - row;
        return table[tableRow][col];
    }

    /**
     * Get all possible moves for a color
     */
    getAllPossibleMoves(game, color) {
        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece && piece.color === color) {
                    const validMoves = game.getValidMoves(row, col);
                    validMoves.forEach(move => {
                        moves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col
                        });
                    });
                }
            }
        }

        return moves;
    }

    /**
     * Check if the game is over
     */
    isGameOver(game) {
        return game.gameOver;
    }

    /**
     * Check if a color is in checkmate
     */
    isCheckmate(game, color) {
        if (!game.isInCheck(color)) return false;
        return !game.hasAnyLegalMoves(color);
    }

    /**
     * Check if the game is in stalemate
     */
    isStalemate(game) {
        const color = game.currentPlayer;
        if (game.isInCheck(color)) return false;
        return !game.hasAnyLegalMoves(color);
    }

    /**
     * Save game state for undo
     */
    saveGameState(game) {
        return {
            board: JSON.parse(JSON.stringify(game.board)),
            currentPlayer: game.currentPlayer,
            enPassantTarget: game.enPassantTarget ? {...game.enPassantTarget} : null,
            castlingRights: JSON.parse(JSON.stringify(game.castlingRights))
        };
    }

    /**
     * Restore game state
     */
    restoreGameState(game, state) {
        game.board = JSON.parse(JSON.stringify(state.board));
        game.currentPlayer = state.currentPlayer;
        game.enPassantTarget = state.enPassantTarget ? {...state.enPassantTarget} : null;
        game.castlingRights = JSON.parse(JSON.stringify(state.castlingRights));
    }
}
