/* ============================================================
 * Quantum Keyboard Navigation — Amira
 * Adds full keyboard control over the chess board grid:
 *   Arrows   : move focus between squares
 *   Home/End : jump to file a / file h of current rank
 *   PgUp/Dn  : jump rank 1 / rank 8
 *   Enter/Sp : activate square (select / move)
 *   Esc      : deselect
 * Works with existing ChessUI without modifying app.js.
 * ============================================================ */
(function () {
    'use strict';

    var focus = { row: 6, col: 4 }; // default near white's e-pawn

    function squareEl(row, col) {
        return document.querySelector(
            '.chess-board .square[data-row="' + row + '"][data-col="' + col + '"]'
        );
    }

    function clearFocusClass() {
        var prev = document.querySelector('.chess-board .square.q-focus');
        if (prev) prev.classList.remove('q-focus');
    }

    function applyFocus() {
        clearFocusClass();
        var el = squareEl(focus.row, focus.col);
        if (el) {
            el.classList.add('q-focus');
            if (typeof el.scrollIntoView === 'function') {
                el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }

    function activateSquare() {
        var el = squareEl(focus.row, focus.col);
        if (!el) return;
        // Simulate click — existing handleSquareClick reads data-row/col.
        el.click();
    }

    function enforceGridRole() {
        var board = document.getElementById('chessBoard');
        if (!board) return;
        if (!board.hasAttribute('tabindex')) board.setAttribute('tabindex', '0');
        board.setAttribute('role', 'grid');
        board.setAttribute('aria-label', 'رقعة الشطرنج — استخدم الأسهم للتنقّل');
    }

    function onKey(e) {
        var target = document.activeElement;
        var inField = target && (target.tagName === 'INPUT' ||
                                 target.tagName === 'TEXTAREA' ||
                                 target.tagName === 'SELECT' ||
                                 target.isContentEditable);
        if (inField) return;

        var board = document.getElementById('chessBoard');
        if (!board) return;
        var boardHasFocus = board.contains(document.activeElement) || document.activeElement === board;
        var isNavKey = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                        'Home','End','PageUp','PageDown','Enter',' ','Spacebar','Escape'].indexOf(e.key) !== -1;
        if (!isNavKey) return;
        if (!boardHasFocus && e.key === 'Escape') return; // don't hijack Esc elsewhere

        // If board doesn't have focus yet but user hit arrow, give it focus.
        if (!boardHasFocus) {
            board.focus({ preventScroll: true });
        }

        var flipped = !!(window.chessUI && window.chessUI.flipped);

        var dRow = 0, dCol = 0;
        switch (e.key) {
            case 'ArrowUp':    dRow = flipped ?  1 : -1; break;
            case 'ArrowDown':  dRow = flipped ? -1 :  1; break;
            case 'ArrowLeft':  dCol = flipped ?  1 : -1; break;
            case 'ArrowRight': dCol = flipped ? -1 :  1; break;
            case 'Home': focus.col = flipped ? 7 : 0; applyFocus(); e.preventDefault(); return;
            case 'End':  focus.col = flipped ? 0 : 7; applyFocus(); e.preventDefault(); return;
            case 'PageUp':   focus.row = flipped ? 7 : 0; applyFocus(); e.preventDefault(); return;
            case 'PageDown': focus.row = flipped ? 0 : 7; applyFocus(); e.preventDefault(); return;
            case 'Enter':
            case ' ':
            case 'Spacebar':
                activateSquare(); e.preventDefault(); return;
            case 'Escape':
                if (window.chessUI && window.chessUI.selectedSquare) {
                    window.chessUI.selectedSquare = null;
                    if (typeof window.chessUI.renderBoard === 'function') window.chessUI.renderBoard();
                }
                e.preventDefault(); return;
        }

        if (dRow || dCol) {
            focus.row = Math.max(0, Math.min(7, focus.row + dRow));
            focus.col = Math.max(0, Math.min(7, focus.col + dCol));
            applyFocus();
            e.preventDefault();
        }
    }

    function onBoardFocus() {
        applyFocus();
    }

    function onBoardClick(e) {
        var sq = e.target.closest('.square');
        if (!sq) return;
        var r = parseInt(sq.dataset.row, 10);
        var c = parseInt(sq.dataset.col, 10);
        if (!isNaN(r) && !isNaN(c)) {
            focus.row = r; focus.col = c;
            applyFocus();
        }
    }

    function boot() {
        enforceGridRole();
        var board = document.getElementById('chessBoard');
        if (!board) return setTimeout(boot, 80);
        board.addEventListener('focus', onBoardFocus);
        board.addEventListener('click', onBoardClick, true);
        document.addEventListener('keydown', onKey);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
