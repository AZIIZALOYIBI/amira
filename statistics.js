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
            lastPlayed: null,
            currentWinStreak: 0,
            bestWinStreak: 0,
            puzzlesSolved: 0,
            perfectGames: 0,
            aiWinsEasy: 0,
            aiWinsMedium: 0,
            aiWinsHard: 0,
            comebackWins: 0,
            totalPlayTime: 0, // in seconds
            gameHistory: [] // Last 50 games
        };
    }

    recordGame(result, moves, playerColor, reason = 'checkmate', extraData = {}) {
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

        // Update result stats and win streak
        if (result === 'win') {
            this.stats.wins[playerColor]++;
            this.stats.currentWinStreak++;

            if (this.stats.currentWinStreak > this.stats.bestWinStreak) {
                this.stats.bestWinStreak = this.stats.currentWinStreak;
            }

            if (reason === 'checkmate') this.stats.checkmates++;
            else if (reason === 'timeout') this.stats.timeouts++;
            else if (reason === 'resignation') this.stats.resignations++;

            // Track AI wins by difficulty
            if (extraData.vsAI && extraData.aiDifficulty) {
                if (extraData.aiDifficulty === 'easy') this.stats.aiWinsEasy++;
                else if (extraData.aiDifficulty === 'medium') this.stats.aiWinsMedium++;
                else if (extraData.aiDifficulty === 'hard') this.stats.aiWinsHard++;
            }

            // Track perfect games (no pieces lost)
            if (extraData.piecesLost === 0) {
                this.stats.perfectGames++;
            }

            // Track comeback wins
            if (extraData.comebackWin) {
                this.stats.comebackWins++;
            }
        } else {
            this.stats.currentWinStreak = 0;

            if (result === 'loss') {
                this.stats.losses[playerColor]++;
            } else if (result === 'draw') {
                this.stats.draws++;
                if (reason === 'stalemate') this.stats.stalemates++;
            }
        }

        // Add play time
        if (extraData.playTime) {
            this.stats.totalPlayTime += extraData.playTime;
        }

        // Add to game history (keep last 50 games)
        this.stats.gameHistory = this.stats.gameHistory || [];
        this.stats.gameHistory.push({
            date: new Date().toISOString(),
            result,
            moves,
            playerColor,
            reason,
            vsAI: extraData.vsAI || false,
            aiDifficulty: extraData.aiDifficulty || null
        });

        if (this.stats.gameHistory.length > 50) {
            this.stats.gameHistory.shift();
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

📊 الإحصائيات العامة:
عدد الألعاب: ${stats.gamesPlayed}
الفوز بالأبيض: ${stats.wins.white} (${stats.whiteWinRate}%)
الفوز بالأسود: ${stats.wins.black} (${stats.blackWinRate}%)
التعادل: ${stats.draws}
معدل الفوز الإجمالي: ${stats.winRate}%

🔥 السلاسل:
سلسلة الفوز الحالية: ${stats.currentWinStreak}
أفضل سلسلة فوز: ${stats.bestWinStreak}

⏱️ إحصائيات اللعب:
متوسط طول اللعبة: ${stats.averageGameLength} حركة
أطول لعبة: ${stats.longestGame} حركة
أقصر لعبة: ${stats.shortestGame === Infinity ? 'لا يوجد' : stats.shortestGame + ' حركة'}
إجمالي وقت اللعب: ${this.formatPlayTime(stats.totalPlayTime)}

🎯 طرق الفوز:
الكش مات: ${stats.checkmates}
الجمود: ${stats.stalemates}
انتهاء الوقت: ${stats.timeouts}

🤖 ضد الذكاء الاصطناعي:
انتصارات - سهل: ${stats.aiWinsEasy}
انتصارات - متوسط: ${stats.aiWinsMedium}
انتصارات - صعب: ${stats.aiWinsHard}

💎 إنجازات خاصة:
ألعاب مثالية (بدون خسائر): ${stats.perfectGames}
انتصارات عودة: ${stats.comebackWins}
ألغاز محلولة: ${stats.puzzlesSolved}

♟️ القطع المأسورة:
- بيادق: ${stats.piecesCaptured.pawn}
- أحصنة: ${stats.piecesCaptured.knight}
- فيلة: ${stats.piecesCaptured.bishop}
- قلاع: ${stats.piecesCaptured.rook}
- ملكات: ${stats.piecesCaptured.queen}

آخر لعب: ${stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleString('ar-SA') : 'لم يتم اللعب بعد'}
        `.trim();

        return text;
    }

    formatPlayTime(seconds) {
        if (!seconds) return '0 دقيقة';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours} ساعة ${minutes} دقيقة`;
        }
        return `${minutes} دقيقة`;
    }

    getRecentPerformance(games = 10) {
        const history = this.stats.gameHistory || [];
        const recent = history.slice(-games);

        if (recent.length === 0) {
            return { wins: 0, losses: 0, draws: 0, winRate: 0 };
        }

        const wins = recent.filter(g => g.result === 'win').length;
        const losses = recent.filter(g => g.result === 'loss').length;
        const draws = recent.filter(g => g.result === 'draw').length;

        return {
            wins,
            losses,
            draws,
            winRate: recent.length > 0 ? Math.round((wins / recent.length) * 100) : 0
        };
    }

    getPerformanceByColor() {
        const whiteGames = this.stats.wins.white + this.stats.losses.white;
        const blackGames = this.stats.wins.black + this.stats.losses.black;

        return {
            white: {
                games: whiteGames,
                wins: this.stats.wins.white,
                losses: this.stats.losses.white,
                winRate: this.getWinRate('white')
            },
            black: {
                games: blackGames,
                wins: this.stats.wins.black,
                losses: this.stats.losses.black,
                winRate: this.getWinRate('black')
            }
        };
    }

    recordPuzzleSolved() {
        this.stats.puzzlesSolved = (this.stats.puzzlesSolved || 0) + 1;
        this.saveStats();
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
