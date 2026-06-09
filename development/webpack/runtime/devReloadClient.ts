/**
 * @file Dev-only extension reloader, bundled into the privileged background
 * context (the MV3 service worker or the MV2 background page) by the webpack dev
 * server.
 *
 * The UI live-reload client reloads UI pages with `location.reload()`, but that
 * primitive doesn't work for the service worker, background, or content scripts:
 * a service worker can't reload itself meaningfully, and a content script can't
 * even call `runtime.reload`. The only way to pick up changes to those surfaces
 * is a full `chrome.runtime.reload()`, which must run from a privileged context.
 *
 * This module connects to the dev server's WebSocket and, on the custom "reload
 * extension" message (sent only when a background or content-script bundle
 * actually changed), reloads the whole extension. UI state is lost on reload,
 * which is acceptable in development.
 *
 * It is only ever added as a webpack entry while the dev server is running
 * (`--watch`), so it never ships in production builds.
 */

import { DEV_RELOAD_MESSAGE_TYPE } from './devReloadProtocol';

// `__resourceQuery` is the query string of the request that pulled this module
// in as an entry (e.g. `?protocol=ws&hostname=localhost&port=12345`). webpack
// injects it per-module; the dev server fills it with the resolved WebSocket
// connection details at server start (the port is only known then).
declare const __resourceQuery: string;

const MAX_RECONNECT_DELAY_MS = 5_000;

// `chrome` in Chrome/MV3 service workers; `browser` (with a `chrome` alias) in
// Firefox. `runtime.reload()` exists on both.
const extension = globalThis as unknown as {
  browser?: typeof chrome;
  chrome?: typeof chrome;
};
const runtime = extension.browser?.runtime ?? extension.chrome?.runtime;

/**
 * Builds the dev-server WebSocket URL from this module's `__resourceQuery`.
 *
 * @returns The WebSocket URL to connect to.
 */
function getSocketUrl(): string {
  const params = new URLSearchParams(__resourceQuery.slice(1));
  const protocol = params.get('protocol') ?? 'ws';
  const hostname = params.get('hostname') ?? 'localhost';
  const port = params.get('port');
  const path = params.get('path') ?? '/ws';
  const host = port ? `${hostname}:${port}` : hostname;
  return `${protocol}://${host}${path}`;
}

/**
 * Schedules a reconnection attempt with exponential backoff.
 *
 * @param previousAttempt - The number of the attempt that just failed.
 */
function scheduleReconnect(previousAttempt: number): void {
  const attempt = previousAttempt + 1;
  const delay = Math.min(2 ** attempt * 100, MAX_RECONNECT_DELAY_MS);
  setTimeout(() => connect(attempt), delay);
}

/**
 * Opens the dev-server WebSocket and reloads the extension when the server
 * signals that a background or content-script bundle changed.
 *
 * @param reconnectAttempt - The current reconnection attempt count (0 on first
 * connect).
 */
function connect(reconnectAttempt = 0): void {
  let attempt = reconnectAttempt;
  let socket: WebSocket;
  try {
    socket = new WebSocket(getSocketUrl());
  } catch {
    scheduleReconnect(attempt);
    return;
  }

  let reloading = false;

  socket.addEventListener('open', () => {
    attempt = 0;
  });

  socket.addEventListener('message', (event: MessageEvent) => {
    if (reloading || typeof event.data !== 'string') {
      return;
    }
    let message: { type?: string };
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.type === DEV_RELOAD_MESSAGE_TYPE) {
      reloading = true;
      // eslint-disable-next-line no-console
      console.info(
        '[MetaMask dev] reloading extension (background or content script changed)…',
      );
      // Close first so the impending teardown isn't logged as an unexpected
      // disconnect, then reload the whole extension.
      try {
        socket.close();
      } catch {
        // ignore
      }
      runtime?.reload();
    }
  });

  socket.addEventListener('close', () => {
    if (!reloading) {
      scheduleReconnect(attempt);
    }
  });

  socket.addEventListener('error', () => {
    // Let the `close` handler schedule the reconnect.
    try {
      socket.close();
    } catch {
      // ignore
    }
  });
}

// Only run inside a privileged extension context that can actually reload the
// extension, and where WebSocket is available (MV3 service workers support it in
// current browsers). Otherwise this is a no-op rather than a reconnect loop.
if (runtime && typeof WebSocket !== 'undefined') {
  connect();
}
