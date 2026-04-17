/**
 * Chess game logic
 * Supports: all standard piece moves, castling, en passant, pawn promotion,
 * check/checkmate/stalemate detection, and move history.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const PIECES = {
  // White pieces (uppercase)
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  // Black pieces (lowercase internal, display with different unicode)
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']; // row 0 = rank 8

// ─── Game State ──────────────────────────────────────────────────────────────

let board = [];          // 8×8 array of piece strings or null
let turn = 'w';          // 'w' or 'b'
let selected = null;     // {row, col} of selected square
let legalMoves = [];     // legal moves for selected piece
let enPassantTarget = null; // {row, col} square that can be captured en passant
let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
let moveHistory = [];    // array of move notation strings
let lastMove = null;     // {from, to}
let capturedPieces = { w: [], b: [] };
let flipped = false;     // board orientation
let gameOver = false;
let promotionPending = null; // { from, to, color }

// ─── Initialization ──────────────────────────────────────────────────────────

function initBoard() {
  board = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
  ];
  turn = 'w';
  selected = null;
  legalMoves = [];
  enPassantTarget = null;
  castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
  moveHistory = [];
  lastMove = null;
  capturedPieces = { w: [], b: [] };
  gameOver = false;
  promotionPending = null;
  renderBoard();
  renderMoveHistory();
  renderCapturedPieces();
  updateStatus('White to move');
}

// ─── Board Rendering ─────────────────────────────────────────────────────────

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  const kingInCheck = isInCheck(turn);
  const kingPos = findKing(turn);

  for (let visualRow = 0; visualRow < 8; visualRow++) {
    for (let visualCol = 0; visualCol < 8; visualCol++) {
      const row = flipped ? 7 - visualRow : visualRow;
      const col = flipped ? 7 - visualCol : visualCol;

      const square = document.createElement('div');
      const isLight = (row + col) % 2 === 0;
      square.className = `square ${isLight ? 'light' : 'dark'}`;
      square.dataset.row = row;
      square.dataset.col = col;

      // Highlight last move
      if (lastMove &&
          ((lastMove.from.row === row && lastMove.from.col === col) ||
           (lastMove.to.row === row && lastMove.to.col === col))) {
        square.classList.add('last-move');
      }

      // Highlight selected square
      if (selected && selected.row === row && selected.col === col) {
        square.classList.add('selected');
      }

      // Highlight legal moves
      const isLegal = legalMoves.some(m => m.row === row && m.col === col);
      if (isLegal) {
        if (board[row][col] && pieceColor(board[row][col]) !== turn) {
          square.classList.add('legal-capture');
        } else {
          square.classList.add('legal-move');
        }
      }

      // Highlight king in check
      if (kingInCheck && kingPos && kingPos.row === row && kingPos.col === col) {
        square.classList.add('in-check');
      }

      const piece = board[row][col];
      if (piece) {
        const pieceEl = document.createElement('span');
        pieceEl.className = 'piece';
        pieceEl.textContent = PIECES[piece];
        square.appendChild(pieceEl);
      }

      // Add coordinate labels on edge squares
      if (visualCol === 0) {
        const rankLabel = document.createElement('span');
        rankLabel.style.cssText = 'position:absolute;top:2px;left:3px;font-size:0.6rem;opacity:0.6;pointer-events:none;';
        rankLabel.textContent = RANKS[row];
        square.appendChild(rankLabel);
      }
      if (visualRow === 7) {
        const fileLabel = document.createElement('span');
        fileLabel.style.cssText = 'position:absolute;bottom:2px;right:3px;font-size:0.6rem;opacity:0.6;pointer-events:none;';
        fileLabel.textContent = FILES[col];
        square.appendChild(fileLabel);
      }

      square.addEventListener('click', onSquareClick);
      boardEl.appendChild(square);
    }
  }
}

function updateStatus(msg) {
  document.getElementById('status').textContent = msg;
}

function renderMoveHistory() {
  const list = document.getElementById('moves-list');
  list.innerHTML = '';
  moveHistory.forEach((move, i) => {
    const li = document.createElement('li');
    if (i % 2 === 0) {
      li.textContent = `${Math.floor(i / 2) + 1}. ${move}`;
    } else {
      li.textContent = move;
    }
    if (i === moveHistory.length - 1) li.classList.add('current-move');
    list.appendChild(li);
  });
  list.scrollTop = list.scrollHeight;
}

function renderCapturedPieces() {
  document.getElementById('captured-white').textContent =
    capturedPieces.w.map(p => PIECES[p]).join('');
  document.getElementById('captured-black').textContent =
    capturedPieces.b.map(p => PIECES[p]).join('');
}

// ─── Click Handler ────────────────────────────────────────────────────────────

function onSquareClick(e) {
  if (gameOver || promotionPending) return;

  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);
  const piece = board[row][col];

  if (selected) {
    const isLegal = legalMoves.some(m => m.row === row && m.col === col);
    if (isLegal) {
      executeMove(selected.row, selected.col, row, col);
      return;
    }
  }

  // Select a piece of the current player's color
  if (piece && pieceColor(piece) === turn) {
    if (selected && selected.row === row && selected.col === col) {
      // Deselect
      selected = null;
      legalMoves = [];
    } else {
      selected = { row, col };
      legalMoves = getLegalMoves(row, col);
    }
    renderBoard();
  } else {
    selected = null;
    legalMoves = [];
    renderBoard();
  }
}

// ─── Move Execution ───────────────────────────────────────────────────────────

function executeMove(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const captured = board[toRow][toCol];
  const notation = buildNotation(fromRow, fromCol, toRow, toCol);

  // En passant capture
  let epCapture = null;
  if (piece[1] === 'P' && enPassantTarget &&
      toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
    const epRow = fromRow;
    epCapture = { row: epRow, col: toCol };
  }

  // Make the move on the board
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;

  // Handle en passant capture
  if (epCapture) {
    const epPiece = board[epCapture.row][epCapture.col];
    capturedPieces[turn].push(epPiece);
    board[epCapture.row][epCapture.col] = null;
  }

  // Handle castling rook move
  if (piece === 'wK') {
    if (fromCol === 4 && toCol === 6) { // kingside
      board[7][5] = 'wR'; board[7][7] = null;
    } else if (fromCol === 4 && toCol === 2) { // queenside
      board[7][3] = 'wR'; board[7][0] = null;
    }
    castlingRights.wK = false;
    castlingRights.wQ = false;
  }
  if (piece === 'bK') {
    if (fromCol === 4 && toCol === 6) {
      board[0][5] = 'bR'; board[0][7] = null;
    } else if (fromCol === 4 && toCol === 2) {
      board[0][3] = 'bR'; board[0][0] = null;
    }
    castlingRights.bK = false;
    castlingRights.bQ = false;
  }
  if (piece === 'wR') {
    if (fromCol === 0) castlingRights.wQ = false;
    if (fromCol === 7) castlingRights.wK = false;
  }
  if (piece === 'bR') {
    if (fromCol === 0) castlingRights.bQ = false;
    if (fromCol === 7) castlingRights.bK = false;
  }

  // Update en passant target
  if (piece[1] === 'P' && Math.abs(toRow - fromRow) === 2) {
    enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
  } else {
    enPassantTarget = null;
  }

  // Track captured piece
  if (captured) {
    capturedPieces[turn].push(captured);
  }

  // Check for pawn promotion
  if (piece === 'wP' && toRow === 0) {
    promotionPending = { toRow, toCol, color: 'w' };
    lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
    selected = null;
    legalMoves = [];
    renderBoard();
    showPromotionModal('w', notation);
    return;
  }
  if (piece === 'bP' && toRow === 7) {
    promotionPending = { toRow, toCol, color: 'b' };
    lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
    selected = null;
    legalMoves = [];
    renderBoard();
    showPromotionModal('b', notation);
    return;
  }

  finishMove(notation, fromRow, fromCol, toRow, toCol);
}

function finishMove(notation, fromRow, fromCol, toRow, toCol) {
  lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
  selected = null;
  legalMoves = [];

  // Switch turns
  turn = turn === 'w' ? 'b' : 'w';

  // Check for check/checkmate/stalemate
  const inCheck = isInCheck(turn);
  const hasMoves = hasAnyLegalMove(turn);
  let checkSuffix = '';

  if (inCheck && !hasMoves) {
    checkSuffix = '#';
    const winner = turn === 'w' ? 'Black' : 'White';
    moveHistory.push(notation + checkSuffix);
    renderMoveHistory();
    renderCapturedPieces();
    renderBoard();
    updateStatus(`Checkmate! ${winner} wins! 🏆`);
    gameOver = true;
    return;
  } else if (!inCheck && !hasMoves) {
    moveHistory.push(notation);
    renderMoveHistory();
    renderCapturedPieces();
    renderBoard();
    updateStatus('Stalemate! Draw! 🤝');
    gameOver = true;
    return;
  } else if (inCheck) {
    checkSuffix = '+';
  }

  moveHistory.push(notation + checkSuffix);
  renderMoveHistory();
  renderCapturedPieces();
  renderBoard();
  updateStatus(`${turn === 'w' ? 'White' : 'Black'} to move${inCheck ? ' (Check!)' : ''}`);
}

// ─── Promotion ────────────────────────────────────────────────────────────────

function showPromotionModal(color, notation) {
  const modal = document.getElementById('promotion-modal');
  const piecesEl = document.getElementById('promotion-pieces');
  piecesEl.innerHTML = '';

  const promotionTypes = ['Q', 'R', 'B', 'N'];
  promotionTypes.forEach(type => {
    const key = color + type;
    const btn = document.createElement('div');
    btn.className = 'promotion-piece';
    btn.textContent = PIECES[key];
    btn.addEventListener('click', () => {
      board[promotionPending.toRow][promotionPending.toCol] = key;
      modal.classList.remove('active');
      const { toRow, toCol } = promotionPending;
      const fromPos = lastMove.from;
      promotionPending = null;
      finishMove(notation + '=' + type, fromPos.row, fromPos.col, toRow, toCol);
    });
    piecesEl.appendChild(btn);
  });

  modal.classList.add('active');
}

// ─── Move Generation ─────────────────────────────────────────────────────────

function pieceColor(piece) {
  if (!piece) return null;
  return piece[0]; // 'w' or 'b'
}

function getLegalMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const pseudo = getPseudoMoves(row, col, piece);
  // Filter moves that leave own king in check
  return pseudo.filter(move => {
    const snapshot = deepCopyBoard();
    applyMoveToBoard(snapshot, row, col, move.row, move.col, piece);
    return !isKingInCheckOnBoard(snapshot, pieceColor(piece));
  });
}

function getPseudoMoves(row, col, piece) {
  const color = piece[0];
  const type = piece[1];
  const moves = [];

  switch (type) {
    case 'P': getPawnMoves(row, col, color, moves); break;
    case 'R': getSlidingMoves(row, col, color, moves, [[0,1],[0,-1],[1,0],[-1,0]]); break;
    case 'B': getSlidingMoves(row, col, color, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]); break;
    case 'Q': getSlidingMoves(row, col, color, moves, [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
    case 'N': getKnightMoves(row, col, color, moves); break;
    case 'K': getKingMoves(row, col, color, moves); break;
  }
  return moves;
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getPawnMoves(row, col, color, moves) {
  const dir = color === 'w' ? -1 : 1;
  const startRow = color === 'w' ? 6 : 1;

  // Forward one square
  if (inBounds(row + dir, col) && !board[row + dir][col]) {
    moves.push({ row: row + dir, col });
    // Forward two squares from start
    if (row === startRow && !board[row + 2 * dir][col]) {
      moves.push({ row: row + 2 * dir, col });
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const nr = row + dir;
    const nc = col + dc;
    if (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (target && pieceColor(target) !== color) {
        moves.push({ row: nr, col: nc });
      }
      // En passant
      if (enPassantTarget && enPassantTarget.row === nr && enPassantTarget.col === nc) {
        moves.push({ row: nr, col: nc });
      }
    }
  }
}

function getSlidingMoves(row, col, color, moves, directions) {
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (target) {
        if (pieceColor(target) !== color) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
  }
}

function getKnightMoves(row, col, color, moves) {
  const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;
    if (inBounds(r, c) && pieceColor(board[r][c]) !== color) {
      moves.push({ row: r, col: c });
    }
  }
}

function getKingMoves(row, col, color, moves) {
  const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;
    if (inBounds(r, c) && pieceColor(board[r][c]) !== color) {
      moves.push({ row: r, col: c });
    }
  }

  // Castling
  if (color === 'w' && row === 7 && col === 4) {
    // Kingside
    if (castlingRights.wK &&
        !board[7][5] && !board[7][6] &&
        !isSquareAttacked(7, 4, 'b') &&
        !isSquareAttacked(7, 5, 'b') &&
        !isSquareAttacked(7, 6, 'b')) {
      moves.push({ row: 7, col: 6 });
    }
    // Queenside
    if (castlingRights.wQ &&
        !board[7][3] && !board[7][2] && !board[7][1] &&
        !isSquareAttacked(7, 4, 'b') &&
        !isSquareAttacked(7, 3, 'b') &&
        !isSquareAttacked(7, 2, 'b')) {
      moves.push({ row: 7, col: 2 });
    }
  }
  if (color === 'b' && row === 0 && col === 4) {
    // Kingside
    if (castlingRights.bK &&
        !board[0][5] && !board[0][6] &&
        !isSquareAttacked(0, 4, 'w') &&
        !isSquareAttacked(0, 5, 'w') &&
        !isSquareAttacked(0, 6, 'w')) {
      moves.push({ row: 0, col: 6 });
    }
    // Queenside
    if (castlingRights.bQ &&
        !board[0][3] && !board[0][2] && !board[0][1] &&
        !isSquareAttacked(0, 4, 'w') &&
        !isSquareAttacked(0, 3, 'w') &&
        !isSquareAttacked(0, 2, 'w')) {
      moves.push({ row: 0, col: 2 });
    }
  }
}

// ─── Check Detection ──────────────────────────────────────────────────────────

function isSquareAttacked(row, col, byColor) {
  return isSquareAttackedOnBoard(board, row, col, byColor);
}

function isSquareAttackedOnBoard(b, row, col, byColor) {
  // Check all opponent pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = b[r][c];
      if (!piece || pieceColor(piece) !== byColor) continue;
      if (canAttackSquare(b, r, c, piece, row, col)) return true;
    }
  }
  return false;
}

function canAttackSquare(b, fromRow, fromCol, piece, toRow, toCol) {
  const color = piece[0];
  const type = piece[1];
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;

  switch (type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      return dr === dir && Math.abs(dc) === 1;
    }
    case 'N':
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
             (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    case 'K':
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    case 'R':
      if (dr !== 0 && dc !== 0) return false;
      return isPathClear(b, fromRow, fromCol, toRow, toCol);
    case 'B':
      if (Math.abs(dr) !== Math.abs(dc)) return false;
      return isPathClear(b, fromRow, fromCol, toRow, toCol);
    case 'Q':
      if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
      return isPathClear(b, fromRow, fromCol, toRow, toCol);
  }
  return false;
}

function isPathClear(b, fromRow, fromCol, toRow, toCol) {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  let r = fromRow + dr;
  let c = fromCol + dc;
  while (r !== toRow || c !== toCol) {
    if (b[r][c]) return false;
    r += dr;
    c += dc;
  }
  return true;
}

function findKing(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === color + 'K') return { row: r, col: c };
    }
  }
  return null;
}

function findKingOnBoard(b, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (b[r][c] === color + 'K') return { row: r, col: c };
    }
  }
  return null;
}

function isInCheck(color) {
  const king = findKing(color);
  if (!king) return false;
  const opponent = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(king.row, king.col, opponent);
}

function isKingInCheckOnBoard(b, color) {
  const king = findKingOnBoard(b, color);
  if (!king) return false;
  const opponent = color === 'w' ? 'b' : 'w';
  return isSquareAttackedOnBoard(b, king.row, king.col, opponent);
}

function hasAnyLegalMove(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (pieceColor(board[r][c]) === color) {
        if (getLegalMoves(r, c).length > 0) return true;
      }
    }
  }
  return false;
}

// ─── Board Utilities ──────────────────────────────────────────────────────────

function deepCopyBoard() {
  return board.map(row => [...row]);
}

function applyMoveToBoard(b, fromRow, fromCol, toRow, toCol, piece) {
  b[toRow][toCol] = b[fromRow][fromCol];
  b[fromRow][fromCol] = null;

  // En passant
  if (piece[1] === 'P' && enPassantTarget &&
      toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
    b[fromRow][toCol] = null;
  }

  // Castling
  if (piece === 'wK' && fromCol === 4) {
    if (toCol === 6) { b[7][5] = 'wR'; b[7][7] = null; }
    if (toCol === 2) { b[7][3] = 'wR'; b[7][0] = null; }
  }
  if (piece === 'bK' && fromCol === 4) {
    if (toCol === 6) { b[0][5] = 'bR'; b[0][7] = null; }
    if (toCol === 2) { b[0][3] = 'bR'; b[0][0] = null; }
  }
}

// ─── Notation ─────────────────────────────────────────────────────────────────

function buildNotation(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const type = piece[1];
  const capture = board[toRow][toCol] !== null ||
    (type === 'P' && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col);
  const toSquare = FILES[toCol] + RANKS[toRow];

  // Castling
  if (type === 'K' && Math.abs(toCol - fromCol) === 2) {
    return toCol > fromCol ? 'O-O' : 'O-O-O';
  }

  let notation = '';
  if (type === 'P') {
    if (capture) notation = FILES[fromCol] + 'x' + toSquare;
    else notation = toSquare;
  } else {
    // Disambiguate if needed
    const typeLetter = type;
    const ambiguous = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === fromRow && c === fromCol) continue;
        if (board[r][c] === piece) {
          const moves = getLegalMoves(r, c);
          if (moves.some(m => m.row === toRow && m.col === toCol)) {
            ambiguous.push({ row: r, col: c });
          }
        }
      }
    }
    let disambig = '';
    if (ambiguous.length > 0) {
      const sameFile = ambiguous.some(a => a.col === fromCol);
      const sameRank = ambiguous.some(a => a.row === fromRow);
      if (!sameFile) disambig = FILES[fromCol];
      else if (!sameRank) disambig = RANKS[fromRow];
      else disambig = FILES[fromCol] + RANKS[fromRow];
    }
    notation = typeLetter + disambig + (capture ? 'x' : '') + toSquare;
  }
  return notation;
}

// ─── Controls ─────────────────────────────────────────────────────────────────

document.getElementById('new-game-btn').addEventListener('click', initBoard);

document.getElementById('flip-btn').addEventListener('click', () => {
  flipped = !flipped;
  renderBoard();
});

// ─── Start ────────────────────────────────────────────────────────────────────

initBoard();
