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
        let bestValue = -1000000;
        let alpha = -1000000;
        const beta = 1000000;

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

        if (depth === 0) {
            return this.evaluatePositionFast(game, aiColor);
        }

        let moves = this.getAllPossibleMoves(game, currentColor);

        if (moves.length === 0) {
            if (game.isInCheck(currentColor)) {
                // Checkmate
                return maximizingPlayer ? -1000000 - depth : 1000000 + depth;
            } else {
                // Stalemate
                return 0;
            }
        }

        moves = this.orderMoves(game, moves);

        if (maximizingPlayer) {
            let maxEval = -1000000;
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

        let minEval = 1000000;
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
            
            let aScore = 0;
            let bScore = 0;

            if (aTarget) {
                const aAttacker = game.getPiece(a.fromRow, a.fromCol);
                aScore = 10 * this.pieceValues[aTarget.type] - (aAttacker ? this.pieceValues[aAttacker.type] : 0);
            }
            if (bTarget) {
                const bAttacker = game.getPiece(b.fromRow, b.fromCol);
                bScore = 10 * this.pieceValues[bTarget.type] - (bAttacker ? this.pieceValues[bAttacker.type] : 0);
            }

            // Prioritize pawn promotions
            if (a.toRow === 0 || a.toRow === 7) {
                const p = game.getPiece(a.fromRow, a.fromCol);
                if (p && p.type === 'pawn') aScore += 9000;
            }
            if (b.toRow === 0 || b.toRow === 7) {
                const p = game.getPiece(b.fromRow, b.fromCol);
                if (p && p.type === 'pawn') bScore += 9000;
            }

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
     * Evaluate the current board position without checking for mate
     */
    evaluatePositionFast(game, color) {
        let score = 0;
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
     * Evaluate the current board position
     */
    evaluatePosition(game, color) {
        // Check for checkmate or stalemate
        if (this.isCheckmate(game, color)) {
            return -1000000;
        }
        if (this.isCheckmate(game, color === 'white' ? 'black' : 'white')) {
            return 1000000;
        }
        if (this.isStalemate(game)) {
            return 0;
        }

        return this.evaluatePositionFast(game, color);
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
     * Save game state for undo (Optimized)
     */
    saveGameState(game) {
        const boardCopy = new Array(8);
        for (let r = 0; r < 8; r++) {
            boardCopy[r] = new Array(8);
            for (let c = 0; c < 8; c++) {
                const p = game.board[r][c];
                boardCopy[r][c] = p ? { type: p.type, color: p.color } : null;
            }
        }
        return {
            board: boardCopy,
            currentPlayer: game.currentPlayer,
            enPassantTarget: game.enPassantTarget ? { row: game.enPassantTarget.row, col: game.enPassantTarget.col } : null,
            castlingRights: {
                white: { kingside: game.castlingRights.white.kingside, queenside: game.castlingRights.white.queenside },
                black: { kingside: game.castlingRights.black.kingside, queenside: game.castlingRights.black.queenside }
            }
        };
    }

    /**
     * Restore game state (Optimized)
     */
    restoreGameState(game, state) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = state.board[r][c];
                game.board[r][c] = p ? { type: p.type, color: p.color } : null;
            }
        }
        game.currentPlayer = state.currentPlayer;
        game.enPassantTarget = state.enPassantTarget ? { row: state.enPassantTarget.row, col: state.enPassantTarget.col } : null;
        game.castlingRights.white.kingside = state.castlingRights.white.kingside;
        game.castlingRights.white.queenside = state.castlingRights.white.queenside;
        game.castlingRights.black.kingside = state.castlingRights.black.kingside;
        game.castlingRights.black.queenside = state.castlingRights.black.queenside;
    }
}
