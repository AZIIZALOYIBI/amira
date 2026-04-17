/**
 * Chess Statistics and Analysis
 * Tracks player performance, game statistics, and provides analysis
 */

class ChessStatistics {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        try {
            const data = localStorage.getItem('amira_chess_stats');
            return data ? JSON.parse(data) : this.getDefaultStats();
        } catch (e) {
            return this.getDefaultStats();
        }
    }

    getDefaultStats() {
        return {
            gamesPlayed: 0,
            wins: { white: 0, black: 0 },
            losses: { white: 0, black: 0 },
            draws: 0,
            totalMoves: 0,
            averageGameLength: 0,
            longestGame: 0,
            shortestGame: Infinity,
            checkmates: 0,
            stalemates: 0,
            resignations: 0,
            timeouts: 0,
            piecesCaptured: {
                pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0
            },
            openings: {},
            lastPlayed: null
        };
    }

    recordGame(result, moves, playerColor, reason = 'checkmate') {
        this.stats.gamesPlayed++;
        this.stats.totalMoves += moves;
        this.stats.lastPlayed = new Date().toISOString();

        // Update game length stats
        if (moves > this.stats.longestGame) {
            this.stats.longestGame = moves;
        }
        if (moves < this.stats.shortestGame || this.stats.shortestGame === Infinity) {
            this.stats.shortestGame = moves;
        }
        this.stats.averageGameLength = Math.floor(this.stats.totalMoves / this.stats.gamesPlayed);

        // Update result stats
        if (result === 'win') {
            this.stats.wins[playerColor]++;
            if (reason === 'checkmate') this.stats.checkmates++;
            else if (reason === 'timeout') this.stats.timeouts++;
            else if (reason === 'resignation') this.stats.resignations++;
        } else if (result === 'loss') {
            this.stats.losses[playerColor]++;
        } else if (result === 'draw') {
            this.stats.draws++;
            if (reason === 'stalemate') this.stats.stalemates++;
        }

        this.saveStats();
    }

    recordCapture(pieceType) {
        if (this.stats.piecesCaptured[pieceType] !== undefined) {
            this.stats.piecesCaptured[pieceType]++;
            this.saveStats();
        }
    }

    recordOpening(openingName) {
        if (!this.stats.openings[openingName]) {
            this.stats.openings[openingName] = 0;
        }
        this.stats.openings[openingName]++;
        this.saveStats();
    }

    getWinRate(color = null) {
        const totalGames = this.stats.gamesPlayed - this.stats.draws;
        if (totalGames === 0) return 0;

        if (color) {
            const wins = this.stats.wins[color];
            const losses = this.stats.losses[color];
            const total = wins + losses;
            return total > 0 ? Math.round((wins / total) * 100) : 0;
        }

        const totalWins = this.stats.wins.white + this.stats.wins.black;
        return Math.round((totalWins / totalGames) * 100);
    }

    getStats() {
        return {
            ...this.stats,
            winRate: this.getWinRate(),
            whiteWinRate: this.getWinRate('white'),
            blackWinRate: this.getWinRate('black')
        };
    }

    saveStats() {
        try {
            localStorage.setItem('amira_chess_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save statistics:', e);
        }
    }

    reset() {
        this.stats = this.getDefaultStats();
        this.saveStats();
    }

    exportStats() {
        const stats = this.getStats();
        const text = `
إحصائيات لعبة الشطرنج - Amira Chess
=====================================

عدد الألعاب: ${stats.gamesPlayed}
الفوز بالأبيض: ${stats.wins.white} (${stats.whiteWinRate}%)
الفوز بالأسود: ${stats.wins.black} (${stats.blackWinRate}%)
التعادل: ${stats.draws}
معدل الفوز الإجمالي: ${stats.winRate}%

متوسط طول اللعبة: ${stats.averageGameLength} حركة
أطول لعبة: ${stats.longestGame} حركة
أقصر لعبة: ${stats.shortestGame === Infinity ? 'N/A' : stats.shortestGame + ' حركة'}

الكش مات: ${stats.checkmates}
الجمود: ${stats.stalemates}
انتهاء الوقت: ${stats.timeouts}

القطع المأسورة:
- بيادق: ${stats.piecesCaptured.pawn}
- أحصنة: ${stats.piecesCaptured.knight}
- فيلة: ${stats.piecesCaptured.bishop}
- قلاع: ${stats.piecesCaptured.rook}
- ملكات: ${stats.piecesCaptured.queen}

آخر لعب: ${stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleString('ar-SA') : 'لم يتم اللعب بعد'}
        `.trim();

        return text;
    }
}

// Chess Opening Recognition
class OpeningRecognizer {
    constructor() {
        this.openings = {
            'e4 e5 Nf3 Nc6': 'الإيطالية',
            'e4 e5 Nf3 Nc6 Bc4': 'الإيطالية الكلاسيكية',
            'e4 e5 Nf3 Nc6 Bb5': 'الإسبانية (روي لوبيز)',
            'e4 c5': 'الدفاع الصقلي',
            'e4 e6': 'الدفاع الفرنسي',
            'e4 c6': 'دفاع كارو-كان',
            'd4 d5': 'لعبة البيدق الملكة',
            'd4 Nf6': 'الدفاع الهندي',
            'd4 Nf6 c4': 'الهندي الملكة',
            'e4 e5 Nf3 Nf6': 'دفاع بتروف',
            'e4 d5': 'الدفاع الإسكندنافي',
            'Nf3 d5 d4 Nf6': 'لندن',
            'e4 e5 Nf3 Nc6 Bc4 Bc5': 'الإيطالية جوكو بيانو'
        };
    }

    recognize(moveHistory) {
        if (moveHistory.length < 2) return null;

        // Build move string in standard notation
        let moveString = '';
        for (let i = 0; i < Math.min(6, moveHistory.length); i++) {
            const move = moveHistory[i];
            // Simplified - would need full algebraic notation
            moveString += this.simplifyMove(move) + ' ';
        }

        moveString = moveString.trim();

        // Check for known openings
        for (const [key, name] of Object.entries(this.openings)) {
            if (moveString.startsWith(key)) {
                return name;
            }
        }

        return null;
    }

    simplifyMove(move) {
        // This is a simplified version - full implementation would need proper notation
        const pieceMap = {
            knight: 'N',
            bishop: 'B',
            rook: 'R',
            queen: 'Q',
            king: 'K',
            pawn: ''
        };

        const files = 'abcdefgh';
        const piece = pieceMap[move.piece] || '';
        const to = files[move.to.col] + (8 - move.to.row);

        return piece + to;
    }
}
