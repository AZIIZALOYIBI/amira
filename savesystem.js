/**
 * Game Save/Load System
 * Allows players to save and restore games
 */

class GameSaveSystem {
    constructor() {
        this.savedGames = this.loadSavedGames();
        this.maxSaves = 10; // Maximum number of saved games
    }

    loadSavedGames() {
        try {
            const data = localStorage.getItem('amira_saved_games');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveSavedGames() {
        try {
            localStorage.setItem('amira_saved_games', JSON.stringify(this.savedGames));
        } catch (e) {
            console.error('Failed to save games:', e);
        }
    }

    saveGame(game, name = null) {
        const saveData = {
            id: Date.now(),
            name: name || `لعبة ${new Date().toLocaleDateString('ar-SA')}`,
            date: new Date().toISOString(),
            board: JSON.parse(JSON.stringify(game.board)),
            currentPlayer: game.currentPlayer,
            gameOver: game.gameOver,
            checkState: game.checkState,
            lastMove: game.lastMove,
            capturedPieces: JSON.parse(JSON.stringify(game.capturedPieces)),
            moveHistory: JSON.parse(JSON.stringify(game.moveHistory)),
            enPassantTarget: game.enPassantTarget,
            castlingRights: JSON.parse(JSON.stringify(game.castlingRights)),
            timers: game.timers || null,
            playerNames: game.playerNames || null,
            gameMode: game.gameMode || 'classic'
        };

        // Remove oldest save if we're at max capacity
        if (this.savedGames.length >= this.maxSaves) {
            this.savedGames.shift();
        }

        this.savedGames.push(saveData);
        this.saveSavedGames();

        return saveData.id;
    }

    loadGame(saveId) {
        const save = this.savedGames.find(s => s.id === saveId);
        if (!save) {
            return null;
        }

        return {
            board: JSON.parse(JSON.stringify(save.board)),
            currentPlayer: save.currentPlayer,
            gameOver: save.gameOver,
            checkState: save.checkState,
            lastMove: save.lastMove,
            capturedPieces: JSON.parse(JSON.stringify(save.capturedPieces)),
            moveHistory: JSON.parse(JSON.stringify(save.moveHistory)),
            enPassantTarget: save.enPassantTarget,
            castlingRights: JSON.parse(JSON.stringify(save.castlingRights)),
            timers: save.timers,
            playerNames: save.playerNames,
            gameMode: save.gameMode
        };
    }

    deleteSave(saveId) {
        this.savedGames = this.savedGames.filter(s => s.id !== saveId);
        this.saveSavedGames();
    }

    getSavedGames() {
        return this.savedGames.map(save => ({
            id: save.id,
            name: save.name,
            date: save.date,
            currentPlayer: save.currentPlayer,
            moveCount: save.moveHistory.length
        }));
    }

    renameSave(saveId, newName) {
        const save = this.savedGames.find(s => s.id === saveId);
        if (save) {
            save.name = newName;
            this.saveSavedGames();
            return true;
        }
        return false;
    }

    exportGame(saveId) {
        const save = this.savedGames.find(s => s.id === saveId);
        if (!save) return null;

        // Export as JSON
        const exportData = {
            game: 'Amira Chess',
            version: '1.0',
            exported: new Date().toISOString(),
            ...save
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        return URL.createObjectURL(blob);
    }

    importGame(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // Validate data structure
            if (!data.board || !data.currentPlayer) {
                throw new Error('Invalid game data');
            }

            // Create new save from imported data
            const saveData = {
                id: Date.now(),
                name: `${data.name || 'لعبة مستوردة'} (${new Date().toLocaleDateString('ar-SA')})`,
                date: new Date().toISOString(),
                board: data.board,
                currentPlayer: data.currentPlayer,
                gameOver: data.gameOver || false,
                checkState: data.checkState || null,
                lastMove: data.lastMove || null,
                capturedPieces: data.capturedPieces || { white: [], black: [] },
                moveHistory: data.moveHistory || [],
                enPassantTarget: data.enPassantTarget || null,
                castlingRights: data.castlingRights || {
                    white: { kingside: true, queenside: true },
                    black: { kingside: true, queenside: true }
                },
                timers: data.timers || null,
                playerNames: data.playerNames || null,
                gameMode: data.gameMode || 'classic'
            };

            if (this.savedGames.length >= this.maxSaves) {
                this.savedGames.shift();
            }

            this.savedGames.push(saveData);
            this.saveSavedGames();

            return saveData.id;
        } catch (e) {
            console.error('Failed to import game:', e);
            return null;
        }
    }
}
