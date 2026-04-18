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
        const savedState = this.saveGameState(game);
        game.currentPlayer = color;

        let allMoves = this.getAllPossibleMoves(game, color);
        allMoves = this.orderMoves(game, allMoves);
        if (allMoves.length === 0) {
            this.restoreGameState(game, savedState);
            return null;
        }

        // Easy mode: sometimes choose a legal but non-optimal move.
        if (this.difficulty === 'easy' && Math.random() < 0.25) {
            const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            this.restoreGameState(game, savedState);
            return randomMove;
        }

        let bestMove = allMoves[0];
        let bestValue = -Infinity;
        let alpha = -Infinity;
        const beta = Infinity;

        for (const move of allMoves) {
            const stateBeforeMove = this.saveGameState(game);
            this.applyMove(game, move);
            const score = this.minimax(
                game,
                this.maxDepth - 1,
                alpha,
                beta,
                false,
                color
            );
            this.restoreGameState(game, stateBeforeMove);

            if (score > bestValue) {
                bestValue = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, bestValue);
        }

        const endTime = Date.now();
        console.log(`AI evaluated ${this.positionCount} positions in ${endTime - startTime}ms`);
        console.log(`Best move value: ${bestValue}`);
        this.restoreGameState(game, savedState);

        return bestMove;
    }

    minimax(game, depth, alpha, beta, maximizingPlayer, aiColor) {
        this.positionCount++;
        const currentColor = maximizingPlayer ? aiColor : this.getOpponentColor(aiColor);
        game.currentPlayer = currentColor;

        if (depth === 0 || this.isTerminal(game, currentColor)) {
            return this.evaluatePosition(game, aiColor);
        }

        let moves = this.getAllPossibleMoves(game, currentColor);
        moves = this.orderMoves(game, moves);

        if (moves.length === 0) {
            return this.evaluatePosition(game, aiColor);
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const savedState = this.saveGameState(game);
                this.applyMove(game, move);
                const evalScore = this.minimax(game, depth - 1, alpha, beta, false, aiColor);
                this.restoreGameState(game, savedState);

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        }

        let minEval = Infinity;
        for (const move of moves) {
            const savedState = this.saveGameState(game);
            this.applyMove(game, move);
            const evalScore = this.minimax(game, depth - 1, alpha, beta, true, aiColor);
            this.restoreGameState(game, savedState);

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }

    applyMove(game, move) {
        const piece = game.getPiece(move.fromRow, move.fromCol);
        if (!piece) return;

        // Handle en passant in search tree.
        if (piece.type === 'pawn' && game.enPassantTarget &&
            move.toRow === game.enPassantTarget.row &&
            move.toCol === game.enPassantTarget.col &&
            !game.getPiece(move.toRow, move.toCol)) {
            game.board[move.fromRow][move.toCol] = null;
        }

        // Handle castling in search tree.
        if (piece.type === 'king' && Math.abs(move.toCol - move.fromCol) === 2) {
            const backRank = piece.color === 'white' ? 7 : 0;
            if (move.toCol === 6) {
                game.board[backRank][5] = game.board[backRank][7];
                game.board[backRank][7] = null;
            } else if (move.toCol === 2) {
                game.board[backRank][3] = game.board[backRank][0];
                game.board[backRank][0] = null;
            }
        }

        game.board[move.toRow][move.toCol] = piece;
        game.board[move.fromRow][move.fromCol] = null;

        if (piece.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            game.board[move.toRow][move.toCol] = { type: 'queen', color: piece.color };
        }

        if (piece.type === 'pawn' && Math.abs(move.toRow - move.fromRow) === 2) {
            game.enPassantTarget = {
                row: (move.toRow + move.fromRow) / 2,
                col: move.fromCol
            };
        } else {
            game.enPassantTarget = null;
        }

        if (piece.type === 'king') {
            game.castlingRights[piece.color].kingside = false;
            game.castlingRights[piece.color].queenside = false;
        } else if (piece.type === 'rook') {
            if (move.fromCol === 0) game.castlingRights[piece.color].queenside = false;
            if (move.fromCol === 7) game.castlingRights[piece.color].kingside = false;
        }

        game.currentPlayer = this.getOpponentColor(piece.color);
    }

    orderMoves(game, moves) {
        return moves.slice().sort((a, b) => {
            const aTarget = game.getPiece(a.toRow, a.toCol);
            const bTarget = game.getPiece(b.toRow, b.toCol);
            const aScore = aTarget ? this.pieceValues[aTarget.type] : 0;
            const bScore = bTarget ? this.pieceValues[bTarget.type] : 0;
            return bScore - aScore;
        });
    }

    isTerminal(game, colorToMove) {
        game.currentPlayer = colorToMove;
        return !game.hasAnyLegalMoves(colorToMove);
    }

    getOpponentColor(color) {
        return color === 'white' ? 'black' : 'white';
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
