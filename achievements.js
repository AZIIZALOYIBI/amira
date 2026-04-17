/**
 * Achievements System
 * Gamification features to track player milestones
 */

class AchievementsSystem {
    constructor() {
        this.achievements = this.loadAchievements();
        this.definitions = this.getAchievementDefinitions();
    }

    getAchievementDefinitions() {
        return [
            {
                id: 'first_win',
                name: 'النصر الأول',
                description: 'اربح أول لعبة لك',
                icon: '🏆',
                check: (stats) => stats.wins.white + stats.wins.black >= 1
            },
            {
                id: 'win_streak_3',
                name: 'السلسلة الثلاثية',
                description: 'اربح 3 ألعاب متتالية',
                icon: '🔥',
                check: (stats) => stats.currentWinStreak >= 3
            },
            {
                id: 'win_streak_5',
                name: 'السلسلة الخماسية',
                description: 'اربح 5 ألعاب متتالية',
                icon: '⚡',
                check: (stats) => stats.currentWinStreak >= 5
            },
            {
                id: 'games_10',
                name: 'المتمرس',
                description: 'العب 10 ألعاب',
                icon: '🎮',
                check: (stats) => stats.gamesPlayed >= 10
            },
            {
                id: 'games_50',
                name: 'الخبير',
                description: 'العب 50 لعبة',
                icon: '🎯',
                check: (stats) => stats.gamesPlayed >= 50
            },
            {
                id: 'games_100',
                name: 'الأسطورة',
                description: 'العب 100 لعبة',
                icon: '👑',
                check: (stats) => stats.gamesPlayed >= 100
            },
            {
                id: 'checkmate_master',
                name: 'ماستر الكش مات',
                description: 'حقق 10 كش مات',
                icon: '♟️',
                check: (stats) => stats.checkmates >= 10
            },
            {
                id: 'speed_demon',
                name: 'الشيطان السريع',
                description: 'اربح لعبة في أقل من 20 حركة',
                icon: '⚡',
                check: (stats) => stats.shortestGame <= 20
            },
            {
                id: 'marathon',
                name: 'الماراثون',
                description: 'العب لعبة تتجاوز 100 حركة',
                icon: '🏃',
                check: (stats) => stats.longestGame >= 100
            },
            {
                id: 'puzzle_solver',
                name: 'حلال الألغاز',
                description: 'حل 5 ألغاز شطرنج',
                icon: '🧩',
                check: (stats) => stats.puzzlesSolved >= 5
            },
            {
                id: 'puzzle_master',
                name: 'ماستر الألغاز',
                description: 'حل 20 لغز شطرنج',
                icon: '🎓',
                check: (stats) => stats.puzzlesSolved >= 20
            },
            {
                id: 'perfect_game',
                name: 'اللعبة المثالية',
                description: 'اربح دون خسارة أي قطعة',
                icon: '💎',
                check: (stats) => stats.perfectGames >= 1
            },
            {
                id: 'ai_conqueror',
                name: 'قاهر الذكاء الاصطناعي',
                description: 'اهزم الكمبيوتر في المستوى الصعب',
                icon: '🤖',
                check: (stats) => stats.aiWinsHard >= 1
            },
            {
                id: 'both_colors',
                name: 'اللعب بالجانبين',
                description: 'اربح بالأبيض والأسود',
                icon: '⚖️',
                check: (stats) => stats.wins.white >= 1 && stats.wins.black >= 1
            },
            {
                id: 'comeback_king',
                name: 'ملك العودة',
                description: 'اربح بعد خسارة الملكة',
                icon: '💪',
                check: (stats) => stats.comebackWins >= 1
            }
        ];
    }

    loadAchievements() {
        try {
            const data = localStorage.getItem('amira_achievements');
            return data ? JSON.parse(data) : {
                unlocked: [],
                unlockedAt: {},
                notificationShown: []
            };
        } catch (e) {
            return {
                unlocked: [],
                unlockedAt: {},
                notificationShown: []
            };
        }
    }

    saveAchievements() {
        try {
            localStorage.setItem('amira_achievements', JSON.stringify(this.achievements));
        } catch (e) {
            console.error('Failed to save achievements:', e);
        }
    }

    checkAchievements(stats) {
        const newlyUnlocked = [];

        for (const achievement of this.definitions) {
            if (!this.achievements.unlocked.includes(achievement.id)) {
                if (achievement.check(stats)) {
                    this.unlockAchievement(achievement.id);
                    newlyUnlocked.push(achievement);
                }
            }
        }

        return newlyUnlocked;
    }

    unlockAchievement(achievementId) {
        if (!this.achievements.unlocked.includes(achievementId)) {
            this.achievements.unlocked.push(achievementId);
            this.achievements.unlockedAt[achievementId] = new Date().toISOString();
            this.saveAchievements();
        }
    }

    markNotificationShown(achievementId) {
        if (!this.achievements.notificationShown.includes(achievementId)) {
            this.achievements.notificationShown.push(achievementId);
            this.saveAchievements();
        }
    }

    getUnlockedAchievements() {
        return this.definitions.filter(a => this.achievements.unlocked.includes(a.id));
    }

    getLockedAchievements() {
        return this.definitions.filter(a => !this.achievements.unlocked.includes(a.id));
    }

    getProgress() {
        return {
            total: this.definitions.length,
            unlocked: this.achievements.unlocked.length,
            percentage: Math.round((this.achievements.unlocked.length / this.definitions.length) * 100)
        };
    }

    getPendingNotifications() {
        return this.achievements.unlocked.filter(id =>
            !this.achievements.notificationShown.includes(id)
        ).map(id => this.definitions.find(a => a.id === id));
    }
}
