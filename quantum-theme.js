/* ============================================================
 * Quantum Theme Controller — Amira
 * Manages light/dark/auto theme, meta theme-color sync,
 * and persists user preference in localStorage.
 * ============================================================ */
(function () {
    'use strict';

    var STORAGE_KEY = 'amira_theme_mode';
    var MODES = ['dark', 'light', 'auto'];
    var ICONS = { dark: '🌙', light: '☀️', auto: '🖥️' };
    var LABELS = { dark: 'داكن', light: 'فاتح', auto: 'تلقائي' };

    function systemPrefersDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function resolvedScheme(mode) {
        if (mode === 'auto') return systemPrefersDark() ? 'dark' : 'light';
        return mode;
    }

    function updateMetaThemeColor(scheme) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', scheme === 'light' ? '#f6ebd9' : '#181614');
    }

    function applyTheme(mode) {
        if (MODES.indexOf(mode) === -1) mode = 'dark';
        document.documentElement.setAttribute('data-theme', mode);
        var scheme = resolvedScheme(mode);
        document.documentElement.style.colorScheme = scheme;
        updateMetaThemeColor(scheme);
        try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) { /* ignore */ }
        updateToggleUI(mode);
        document.dispatchEvent(new CustomEvent('quantumtheme:changed', {
            detail: { mode: mode, scheme: scheme }
        }));
    }

    function nextMode(current) {
        var i = MODES.indexOf(current);
        return MODES[(i + 1) % MODES.length];
    }

    function updateToggleUI(mode) {
        var btn = document.getElementById('qThemeToggle');
        if (!btn) return;
        var iconEl = btn.querySelector('.q-theme-icon');
        var labelEl = btn.querySelector('.q-theme-label');
        if (iconEl) iconEl.textContent = ICONS[mode];
        if (labelEl) labelEl.textContent = LABELS[mode];
        btn.setAttribute('aria-label', 'تبديل المظهر — الحالي: ' + LABELS[mode]);
        btn.setAttribute('data-mode', mode);
    }

    function mountToggle() {
        if (document.getElementById('qThemeToggle')) return;
        var host = document.getElementById('headerUserBar') || document.querySelector('header');
        if (!host) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'qThemeToggle';
        btn.className = 'q-theme-toggle';
        btn.innerHTML = '<span class="q-theme-icon" aria-hidden="true">🌙</span>' +
                        '<span class="q-theme-label">داكن</span>';
        btn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme') || 'dark';
            applyTheme(nextMode(current));
        });
        if (host.id === 'headerUserBar') {
            host.insertBefore(btn, host.firstChild);
        } else {
            host.appendChild(btn);
        }
        updateToggleUI(document.documentElement.getAttribute('data-theme') || 'dark');
    }

    function mountSkipLink() {
        if (document.getElementById('qSkipLink')) return;
        var link = document.createElement('a');
        link.id = 'qSkipLink';
        link.className = 'q-skip-link';
        link.href = '#chessBoard';
        link.textContent = 'تخطّي إلى لوحة الشطرنج';
        document.body.insertBefore(link, document.body.firstChild);
    }

    function init() {
        var saved = 'dark';
        try { saved = localStorage.getItem(STORAGE_KEY) || 'dark'; } catch (e) { /* ignore */ }
        applyTheme(saved);
        mountToggle();
        mountSkipLink();

        if (window.matchMedia) {
            var mq = window.matchMedia('(prefers-color-scheme: dark)');
            var handler = function () {
                var current = document.documentElement.getAttribute('data-theme');
                if (current === 'auto') applyTheme('auto');
            };
            if (mq.addEventListener) mq.addEventListener('change', handler);
            else if (mq.addListener) mq.addListener(handler);
        }
    }

    // Apply ASAP to avoid FOUC; DOM widgets mounted on DOMContentLoaded.
    try {
        var early = 'dark';
        try { early = localStorage.getItem(STORAGE_KEY) || 'dark'; } catch (e) {}
        if (MODES.indexOf(early) === -1) early = 'dark';
        document.documentElement.setAttribute('data-theme', early);
        document.documentElement.style.colorScheme = resolvedScheme(early);
    } catch (e) { /* ignore */ }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    window.QuantumTheme = {
        set: applyTheme,
        get: function () { return document.documentElement.getAttribute('data-theme') || 'dark'; },
        cycle: function () { applyTheme(nextMode(this.get())); }
    };
})();
