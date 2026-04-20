/* ============================================================
 * Quantum Widgets — Amira
 * - Live AI Eval Bar (reads ChessAI.evaluatePosition on white)
 * - Material differential badges on captured panels
 * - Keyboard navigation on chess board (arrows/Enter/Space/Home/End)
 * Non-invasive: wraps existing ChessUI methods on first run.
 * ============================================================ */
(function () {
    'use strict';

    var PIECE_VALUE = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };

    function mountEvalBar() {
        var wrap = document.querySelector('.chess-board-container');
        if (!wrap || document.getElementById('qEvalBar')) return;
        var boardWrapper = wrap.querySelector('.board-wrapper');
        if (!boardWrapper) return;

        var container = document.createElement('div');
        container.className = 'q-eval-wrap';

        var bar = document.createElement('div');
        bar.className = 'q-eval-bar';
        bar.id = 'qEvalBar';
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-label', 'تقييم الموقف بواسطة الذكاء الاصطناعي');
        bar.setAttribute('aria-valuemin', '-10');
        bar.setAttribute('aria-valuemax', '10');
        bar.setAttribute('aria-valuenow', '0');

        var midline = document.createElement('div');
        midline.className = 'q-eval-bar__midline';
        var fill = document.createElement('div');
        fill.className = 'q-eval-bar__fill';
        fill.id = 'qEvalBarFill';
        var value = document.createElement('div');
        value.className = 'q-eval-bar__value';
        value.id = 'qEvalBarValue';
        value.textContent = '0.0';

        bar.appendChild(fill);
        bar.appendChild(midline);
        bar.appendChild(value);

        boardWrapper.parentNode.insertBefore(container, boardWrapper);
        container.appendChild(bar);
        container.appendChild(boardWrapper);
    }

    function updateEvalBar(ui) {
        if (!ui || !ui.game || !ui.ai || typeof ui.ai.evaluatePosition !== 'function') return;
        var fill = document.getElementById('qEvalBarFill');
        var value = document.getElementById('qEvalBarValue');
        var bar = document.getElementById('qEvalBar');
        if (!fill || !value || !bar) return;

        var raw = 0;
        try { raw = ui.ai.evaluatePosition(ui.game, 'white'); } catch (e) { raw = 0; }

        // Centipawn → pawn units, clamp to ±10
        var pawns = Math.max(-10, Math.min(10, raw / 100));
        var pct = (pawns / 10) * 50; // 0–50%

        if (pawns >= 0) {
            fill.classList.remove('q-eval-bar__fill--neg');
            fill.style.top = (50 - pct) + '%';
            fill.style.height = pct + '%';
        } else {
            fill.classList.add('q-eval-bar__fill--neg');
            fill.style.top = '50%';
            fill.style.height = (-pct) + '%';
        }
        var label = (pawns > 0 ? '+' : '') + pawns.toFixed(1);
        value.textContent = label;
        bar.setAttribute('aria-valuenow', pawns.toFixed(1));
        bar.setAttribute('aria-valuetext', 'التقييم ' + label + ' لصالح ' + (pawns >= 0 ? 'الأبيض' : 'الأسود'));
    }

    function mountMaterialDiff() {
        ['whiteCaptured', 'blackCaptured'].forEach(function (id) {
            var host = document.getElementById(id);
            if (!host || host.parentNode.querySelector('.q-material-diff[data-for="' + id + '"]')) return;
            var badge = document.createElement('span');
            badge.className = 'q-material-diff';
            badge.setAttribute('data-for', id);
            badge.setAttribute('data-sign', 'zero');
            badge.setAttribute('aria-live', 'polite');
            badge.textContent = '±0';
            host.parentNode.insertBefore(badge, host);
        });
    }

    function calcDiff(ui) {
        if (!ui || !ui.game) return { white: 0, black: 0 };
        var cp = ui.game.capturedPieces || { white: [], black: [] };
        var whiteGain = cp.white.reduce(function (s, p) { return s + (PIECE_VALUE[p.type] || 0); }, 0);
        var blackGain = cp.black.reduce(function (s, p) { return s + (PIECE_VALUE[p.type] || 0); }, 0);
        return { white: whiteGain - blackGain, black: blackGain - whiteGain };
    }

    function updateMaterialDiff(ui) {
        var diffs = calcDiff(ui);
        ['whiteCaptured', 'blackCaptured'].forEach(function (id) {
            var badge = document.querySelector('.q-material-diff[data-for="' + id + '"]');
            if (!badge) return;
            var color = id === 'whiteCaptured' ? 'white' : 'black';
            var d = diffs[color];
            var sign = d > 0 ? 'pos' : d < 0 ? 'neg' : 'zero';
            badge.setAttribute('data-sign', sign);
            badge.textContent = (d > 0 ? '+' : '') + d;
        });
    }

    function wrapMethod(obj, name, after) {
        var orig = obj[name];
        if (!orig || orig.__q_wrapped) return;
        obj[name] = function () {
            var r = orig.apply(this, arguments);
            try { after(this); } catch (e) { /* swallow */ }
            return r;
        };
        obj[name].__q_wrapped = true;
    }

    function tickAll(ui) {
        updateEvalBar(ui);
        updateMaterialDiff(ui);
    }

    function boot() {
        if (!window.chessUI) return setTimeout(boot, 60);
        mountEvalBar();
        mountMaterialDiff();

        var proto = Object.getPrototypeOf(window.chessUI);
        wrapMethod(proto, 'renderBoard', tickAll);
        wrapMethod(proto, 'updateGameStatus', tickAll);

        tickAll(window.chessUI);
        window.QuantumWidgets = { refresh: function () { tickAll(window.chessUI); } };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
