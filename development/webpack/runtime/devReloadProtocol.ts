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
 * Custom WebSocket message the dev server broadcasts when a background or
 * content-script bundle changes. The reloader client listens for it and triggers
 * `chrome.runtime.reload()`. webpack-dev-server's own UI clients ignore message
 * types they don't recognize, so broadcasting to all clients is safe.
 */
export const DEV_RELOAD_MESSAGE_TYPE = 'mm:reload-extension';
