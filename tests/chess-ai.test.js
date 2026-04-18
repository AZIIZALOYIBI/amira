const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadEngines() {
    const context = vm.createContext({
        console,
        setTimeout,
        clearTimeout
    });

    const chessCode = fs.readFileSync(path.join(__dirname, '..', 'chess.js'), 'utf8');
    const aiCode = fs.readFileSync(path.join(__dirname, '..', 'ai.js'), 'utf8');

    vm.runInContext(chessCode, context, { filename: 'chess.js' });
    vm.runInContext(aiCode, context, { filename: 'ai.js' });
    vm.runInContext(
        'globalThis.__exports = { ChessGame: ChessGame, ChessAI: ChessAI };',
        context
    );

    return context.__exports;
}

function emptyBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(null));
}

test('ChessGame initializes board with 32 pieces', () => {
    const { ChessGame } = loadEngines();
    const game = new ChessGame();
    let count = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (game.getPiece(row, col)) count++;
        }
    }
    assert.equal(count, 32);
});

test('castling rights are removed when corner rook is captured', () => {
    const { ChessGame } = loadEngines();
    const game = new ChessGame();
    game.board = emptyBoard();
    game.currentPlayer = 'white';
    game.castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
    };

    game.board[1][1] = { type: 'queen', color: 'white' };
    game.board[0][0] = { type: 'rook', color: 'black' };
    game.board[7][4] = { type: 'king', color: 'white' };
    game.board[0][4] = { type: 'king', color: 'black' };

    game.validMoves = [{ row: 0, col: 0, type: 'capture' }];
    const result = game.makeMove(1, 1, 0, 0);

    assert.equal(result.success, true);
    assert.equal(game.castlingRights.black.queenside, false);
});

test('castling move stores metadata and repositions rook correctly', () => {
    const { ChessGame } = loadEngines();
    const game = new ChessGame();
    game.board = emptyBoard();
    game.currentPlayer = 'white';

    game.board[7][4] = { type: 'king', color: 'white' };
    game.board[7][7] = { type: 'rook', color: 'white' };
    game.board[0][4] = { type: 'king', color: 'black' };

    game.validMoves = [{ row: 7, col: 6, type: 'castle-kingside' }];
    const result = game.makeMove(7, 4, 7, 6);

    assert.equal(result.success, true);
    assert.deepEqual(game.getPiece(7, 5), { type: 'rook', color: 'white' });
    assert.equal(game.getPiece(7, 7), null);
    assert.equal(game.lastMove.castling, 'king');
});

test('ChessAI returns a legal move without throwing', () => {
    const { ChessGame, ChessAI } = loadEngines();
    const game = new ChessGame();
    const ai = new ChessAI('hard');
    game.currentPlayer = 'black';

    const legalMoves = ai.getAllPossibleMoves(game, 'black');
    const move = ai.getBestMove(game, 'black');

    assert.ok(move, 'AI should return a move');
    assert.ok(
        legalMoves.some(
            (m) =>
                m.fromRow === move.fromRow &&
                m.fromCol === move.fromCol &&
                m.toRow === move.toRow &&
                m.toCol === move.toCol
        ),
        'AI move must be legal'
    );
});
