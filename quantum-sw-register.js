/* ============================================================
 * Amira · Service Worker Registration
 * Registers on window.load to avoid blocking initial render.
 * ============================================================ */
(function () {
    if (!('serviceWorker' in navigator)) return;
    // Skip SW on file:// origin (local preview via file system)
    if (location.protocol === 'file:') return;

    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function (err) {
            console.warn('[Amira] SW registration skipped:', err && err.message);
        });
    });
})();
