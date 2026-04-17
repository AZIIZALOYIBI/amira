/**
 * Chess Puzzles System
 * Provides daily chess puzzles for training
 */

class ChessPuzzles {
    constructor() {
        this.currentPuzzle = null;
        this.puzzleHistory = this.loadPuzzleHistory();

        // Collection of chess puzzles (position, solution, difficulty)
        this.puzzles = [
            {
                id: 1,
                difficulty: 'easy',
                fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
                description: 'كش مات في حركة واحدة',
                solution: ['Qxf7#'],
                hint: 'انظر إلى الملك الأسود المكشوف'
            },
            {
                id: 2,
                difficulty: 'easy',
                fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
                description: 'كش مات في حركتين',
                solution: ['Qxf7+', 'Kd8', 'Qf8#'],
                hint: 'استخدم الملكة والفيل معاً'
            },
            {
                id: 3,
                difficulty: 'medium',
                fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1',
                description: 'اكسب قطعة ثمينة',
                solution: ['Bxf7+', 'Rxf7', 'Nxe5'],
                hint: 'ضحية مؤقتة تكسب قطعة'
            },
            {
                id: 4,
                difficulty: 'medium',
                fen: 'r2qkb1r/ppp2ppp/2n5/3pPb2/3Pn3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 1',
                description: 'اكتشف حركة قوية',
                solution: ['Nxd5', 'Nxd5', 'Qxd5'],
                hint: 'استغل التعليق على قطعة الفارس'
            },
            {
                id: 5,
                difficulty: 'hard',
                fen: 'r1b2rk1/ppq2ppp/2p5/4p3/2P5/P1N2N2/1P3PPP/R2QR1K1 w - - 0 1',
                description: 'كش مات في ثلاث حركات',
                solution: ['Qd8+', 'Rxd8', 'Re8+', 'Rxe8', 'Rxe8#'],
                hint: 'تضحيات متتالية للوصول للكش مات'
            },
            {
                id: 6,
                difficulty: 'hard',
                fen: 'r1bq1rk1/ppp2ppp/2n2n2/3p4/1bBP4/2N1PN2/PPP2PPP/R1BQK2R w KQ - 0 1',
                description: 'اكتشف الهجوم التكتيكي',
                solution: ['Bxf7+', 'Kxf7', 'Ng5+', 'Kg8', 'Qb3+'],
                hint: 'هجوم على الملك المكشوف'
            }
        ];
    }

    loadPuzzleHistory() {
        try {
            const data = localStorage.getItem('amira_puzzle_history');
            return data ? JSON.parse(data) : { solved: [], currentStreak: 0, bestStreak: 0 };
        } catch (e) {
            return { solved: [], currentStreak: 0, bestStreak: 0 };
        }
    }

    savePuzzleHistory() {
        try {
            localStorage.setItem('amira_puzzle_history', JSON.stringify(this.puzzleHistory));
        } catch (e) {
            console.error('Failed to save puzzle history:', e);
        }
    }

    getDailyPuzzle() {
        // Get puzzle based on current date
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const puzzleIndex = dayOfYear % this.puzzles.length;

        this.currentPuzzle = this.puzzles[puzzleIndex];
        return this.currentPuzzle;
    }

    getRandomPuzzle(difficulty = null) {
        let filteredPuzzles = this.puzzles;

        if (difficulty) {
            filteredPuzzles = this.puzzles.filter(p => p.difficulty === difficulty);
        }

        const randomIndex = Math.floor(Math.random() * filteredPuzzles.length);
        this.currentPuzzle = filteredPuzzles[randomIndex];
        return this.currentPuzzle;
    }

    getPuzzleById(id) {
        this.currentPuzzle = this.puzzles.find(p => p.id === id);
        return this.currentPuzzle;
    }

    solvePuzzle(puzzleId, correct) {
        if (correct) {
            if (!this.puzzleHistory.solved.includes(puzzleId)) {
                this.puzzleHistory.solved.push(puzzleId);
                this.puzzleHistory.currentStreak++;

                if (this.puzzleHistory.currentStreak > this.puzzleHistory.bestStreak) {
                    this.puzzleHistory.bestStreak = this.puzzleHistory.currentStreak;
                }
            }
        } else {
            this.puzzleHistory.currentStreak = 0;
        }

        this.savePuzzleHistory();
    }

    getStats() {
        return {
            totalSolved: this.puzzleHistory.solved.length,
            totalPuzzles: this.puzzles.length,
            currentStreak: this.puzzleHistory.currentStreak,
            bestStreak: this.puzzleHistory.bestStreak,
            percentageSolved: Math.round((this.puzzleHistory.solved.length / this.puzzles.length) * 100)
        };
    }

    getHint() {
        if (this.currentPuzzle) {
            return this.currentPuzzle.hint;
        }
        return null;
    }
}
