import browser from 'webextension-polyfill';
import { BACKGROUND_RELOAD_MESSAGE_TYPE } from './background-reload-protocol';

// `__resourceQuery` is the query string of the request that pulled this module
// in as an entry (e.g. `?url=ws%3A%2F%2Flocalhost%3A8080%2Fws`). webpack
// injects it per-module; the dev server fills it with its resolved WebSocket
// URL at server start (the port is only known then).
declare const __resourceQuery: string;

const socketUrl = new URLSearchParams(__resourceQuery.slice(1)).get('url');

const MAX_RECONNECT_DELAY_MS = 5_000;

// Storage key holding the fingerprint of the currently running code.
const FINGERPRINT_KEY = 'MM_BACKGROUND_RELOAD_FINGERPRINT';

// The recorded fingerprint must outlive the MV3 service worker, which Chrome
// idle-terminates and later restarts with the *registered* (possibly stale)
// script — `storage.session` survives that. The MV2 background page is
// persistent, so the in-memory fallback suffices there. The extension's real
// wallet state lives in `storage.local`, which we deliberately don't touch.
const sessionStorage = browser.storage?.session;

let memoryFingerprint: string | undefined;

/**
 * @returns The fingerprint of the code this extension instance is running, or
 * `undefined` if none has been recorded yet this extension lifetime.
 */
async function getAppliedFingerprint(): Promise<string | undefined> {
  if (sessionStorage) {
    try {
      return (await sessionStorage.get(FINGERPRINT_KEY))[FINGERPRINT_KEY];
    } catch {
      // fall through to the in-memory value
    }
  }
  return memoryFingerprint;
}

/**
 * Records the given fingerprint as the one this extension instance is running.
 *
 * @param fingerprint - The fingerprint to record.
 */
async function setAppliedFingerprint(fingerprint: string): Promise<void> {
  memoryFingerprint = fingerprint;
  try {
    await sessionStorage?.set({ [FINGERPRINT_KEY]: fingerprint });
  } catch {
    // the in-memory value still covers contexts without storage access
  }
}

let reloading = false;

/**
 * Handles a fingerprint announcement from the dev server: reloads the
 * extension when the announced fingerprint differs from the one this code is
 * running.
 *
 * @param fingerprint - The announced fingerprint of the server's latest build.
 * @param socket - The WebSocket the announcement arrived on.
 */
async function onFingerprint(
  fingerprint: string,
  socket: WebSocket,
): Promise<void> {
  const applied = await getAppliedFingerprint();
  // Re-check `reloading` after the await: another announcement may have begun
  // a reload while this one was reading storage.
  if (reloading || applied === fingerprint) {
    return;
  }
  // Record before reloading: after the reload the new code receives the same
  // announcement again, finds it already recorded, and settles instead of
  // reloading in a loop.
  await setAppliedFingerprint(fingerprint);
  if (applied === undefined) {
    // First announcement of this extension lifetime: the running code was just
    // loaded from the dev server's own output, so only record the baseline.
    return;
  }
  reloading = true;
  // eslint-disable-next-line no-console
  console.info(
    '[MetaMask dev] reloading extension (background or content script changed)…',
  );
  // Close first so the impending teardown isn't logged as an unexpected
  // disconnect, then reload the whole extension.
  socket.close();
  browser.runtime.reload();
}

/**
 * Schedules a reconnection attempt with exponential backoff.
 *
 * @param url - The WebSocket URL to reconnect to.
 * @param previousAttempt - The number of the attempt that just failed.
 */
function scheduleReconnect(url: string, previousAttempt: number): void {
  const attempt = previousAttempt + 1;
  const delay = Math.min(2 ** attempt * 100, MAX_RECONNECT_DELAY_MS);
  setTimeout(() => connect(url, attempt), delay);
}

/**
 * Opens the dev-server WebSocket and processes its fingerprint announcements.
 *
 * @param url - The WebSocket URL to connect to.
 * @param reconnectAttempt - The current reconnection attempt count (0 on first
 * connect).
 */
function connect(url: string, reconnectAttempt = 0): void {
  let attempt = reconnectAttempt;
  let socket: WebSocket;
  try {
    socket = new WebSocket(url);
  } catch {
    scheduleReconnect(url, attempt);
    return;
  }

  socket.addEventListener('open', () => {
    attempt = 0;
  });

  socket.addEventListener('message', (event: MessageEvent) => {
    if (reloading || typeof event.data !== 'string') {
      return;
    }
    let message: { type?: string; data?: unknown };
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (
      message.type === BACKGROUND_RELOAD_MESSAGE_TYPE &&
      typeof message.data === 'string'
    ) {
      void onFingerprint(message.data, socket);
    }
  });

  // A failed connection also fires `close` (after its `error`), so this handler
  // covers both connection failures and later disconnects.
  socket.addEventListener('close', () => {
    if (!reloading) {
      scheduleReconnect(url, attempt);
    }
  });
}

// Only run where WebSocket is available (MV3 service workers support it in
// current browsers). Otherwise this is a no-op rather than a reconnect loop.
if (typeof WebSocket !== 'undefined' && socketUrl) {
  connect(socketUrl);
}
