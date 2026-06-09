/**
 * @file Shared protocol constant for the dev-server extension auto-reload,
 * imported by both the server-side wiring (`utils/devReload`) and the runtime
 * reloader client (`runtime/devReloadClient`).
 *
 * Kept dependency-free so it is safe to bundle into the browser/service-worker
 * context — the client cannot import `utils/devReload` directly, as that would
 * pull `node:path` into the bundle and execute the server wiring.
 */

/**
 * Custom WebSocket message the dev server uses to announce the fingerprint of
 * the current build's privileged code (background, service worker, content
 * scripts, offscreen). The `data` field carries the fingerprint string.
 *
 * It is broadcast after every successful build and pushed to every newly
 * connected client. The reloader client compares it against the fingerprint of
 * the code it is currently running and triggers `chrome.runtime.reload()` on a
 * mismatch — so a change that was built while the client was disconnected
 * (e.g. the MV3 service worker was idle-terminated) is still picked up on
 * reconnect. webpack-dev-server's own UI clients ignore message types they
 * don't recognize, so announcing to all clients is safe.
 */
export const DEV_RELOAD_MESSAGE_TYPE = 'mm:dev-reload-fingerprint';
