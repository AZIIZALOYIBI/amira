/**
 * Move Analysis System
 * Provides analysis and evaluation of chess moves
 */

class MoveAnalyzer {
    constructor() {
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };
    }

    analyzeMove(game, move) {
        const analysis = {
            move: move,
            type: this.getMoveType(game, move),
            evaluation: 0,
            quality: 'good',
            description: '',
            threats: [],
            opportunities: [],
            warnings: []
        };

        // Analyze move type
        if (move.captured) {
            analysis.evaluation += this.pieceValues[move.captured];
            analysis.description = `أسر ${this.getPieceNameArabic(move.captured)}`;
        }

        if (move.promotion) {
            analysis.evaluation += this.pieceValues[move.promotion] - this.pieceValues.pawn;
            analysis.description += ` وترقية إلى ${this.getPieceNameArabic(move.promotion)}`;
        }

        if (move.castling) {
            analysis.evaluation += 50;
            analysis.description = 'تبييت - حركة دفاعية جيدة';
        }

        if (move.enPassant) {
            analysis.evaluation += this.pieceValues.pawn;
            analysis.description = 'أخذ بالمرور';
        }

        // Check if move gives check
        if (move.check) {
            analysis.evaluation += 30;
            analysis.description += ' (كش)';
        }

        // Evaluate based on position improvement
        const positionValue = this.evaluatePositionChange(game, move);
        analysis.evaluation += positionValue;

        // Determine quality
        if (analysis.evaluation > 300) {
            analysis.quality = 'brilliant';
            analysis.description = '⭐ حركة رائعة! ' + analysis.description;
        } else if (analysis.evaluation > 100) {
            analysis.quality = 'great';
            analysis.description = '👍 حركة جيدة جداً! ' + analysis.description;
        } else if (analysis.evaluation > 0) {
            analysis.quality = 'good';
        } else if (analysis.evaluation < -100) {
            analysis.quality = 'blunder';
            analysis.description = '⚠️ خطأ فادح! ' + analysis.description;
            analysis.warnings.push('هذه الحركة قد تخسرك اللعبة');
        } else if (analysis.evaluation < -30) {
            analysis.quality = 'mistake';
            analysis.description = '⚠️ خطأ! ' + analysis.description;
        }

        return analysis;
    }

    getMoveType(game, move) {
        if (move.castling) return 'castling';
        if (move.enPassant) return 'enPassant';
        if (move.promotion) return 'promotion';
        if (move.captured) return 'capture';
        return 'normal';
    }

    evaluatePositionChange(game, move) {
        // Simple position evaluation based on piece placement
        let value = 0;

        const piece = game.getPiece(move.to.row, move.to.col);
        if (!piece) return 0;

        // Center control bonus
        if (this.isCenterSquare(move.to.row, move.to.col)) {
            value += 10;
        }

        // Advanced pawn bonus
        if (piece.type === 'pawn') {
            const advancement = piece.color === 'white' ? (7 - move.to.row) : move.to.row;
            value += advancement * 5;
        }

        // King safety penalty (moving king in opening/middle game)
        if (piece.type === 'king' && game.moveHistory.length < 20 && !move.castling) {
            value -= 20;
        }

        return value;
    }

    isCenterSquare(row, col) {
        return (row >= 3 && row <= 4) && (col >= 3 && col <= 4);
    }

    getPieceNameArabic(pieceType) {
        const names = {
            pawn: 'البيدق',
            knight: 'الحصان',
            bishop: 'الفيل',
            rook: 'القلعة',
            queen: 'الملكة',
            king: 'الملك'
        };
        return names[pieceType] || pieceType;
    }

    suggestBetterMoves(game, currentMove) {
        // Get all valid moves for current player
        const suggestions = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece && piece.color === game.currentPlayer) {
                    const validMoves = game.getValidMoves(row, col);

                    for (const move of validMoves) {
                        const analysis = this.analyzeMove(game, {
                            from: { row, col },
                            to: move,
                            piece: piece.type,
                            captured: game.getPiece(move.row, move.col)?.type
                        });

                        if (analysis.evaluation > 50) {
                            suggestions.push({
                                from: { row, col },
                                to: move,
                                evaluation: analysis.evaluation,
                                description: analysis.description
                            });
                        }
                    }
                }
            }
        }

        // Sort by evaluation and return top 3
        return suggestions
            .sort((a, b) => b.evaluation - a.evaluation)
            .slice(0, 3);
    }

    evaluatePosition(game) {
        let whiteValue = 0;
        let blackValue = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece) {
                    const value = this.pieceValues[piece.type];
                    if (piece.color === 'white') {
                        whiteValue += value;
                    } else {
                        blackValue += value;
                    }
                }
            }
        }

        return {
            white: whiteValue,
            black: blackValue,
            advantage: whiteValue - blackValue,
            advantageText: this.getAdvantageText(whiteValue - blackValue)
        };
    }

    getAdvantageText(advantage) {
        if (advantage > 300) return 'الأبيض متقدم بشكل كبير';
        if (advantage > 100) return 'الأبيض متقدم';
        if (advantage > 0) return 'الأبيض متقدم قليلاً';
        if (advantage === 0) return 'متساوي';
        if (advantage > -100) return 'الأسود متقدم قليلاً';
        if (advantage > -300) return 'الأسود متقدم';
        return 'الأسود متقدم بشكل كبير';
    }
}
