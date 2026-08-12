import browser from 'webextension-polyfill';
import { closeSocket, connectToDevServer } from './connect-to-dev-server';
import { BACKGROUND_UPDATE_MESSAGE_TYPE } from './protocol';

// `__resourceQuery` is the query string of the request that pulled this module
// in as an entry (e.g. `?url=ws%3A%2F%2Flocalhost%3A8080%2Fws`). webpack
// injects it per-module; the dev server fills it with its resolved WebSocket
// URL at server start (the port is only known then).
declare const __resourceQuery: string;

const socketUrl = new URLSearchParams(__resourceQuery.slice(1)).get('url');

// Storage key holding the last background fingerprint seen during this session.
// The fingerprint is stored in the session storage instead of a module-level variable so
// that the value survives service worker restarts during the same session.
const FINGERPRINT_KEY = 'MM_BACKGROUND_FINGERPRINT';

/**
 * @returns The fingerprint of the code this extension instance is running, or
 * `undefined` if none has been recorded yet this extension lifetime.
 */
async function getStoredFingerprint(): Promise<string | undefined> {
  try {
    const record = await browser.storage.session.get(FINGERPRINT_KEY);
    return record[FINGERPRINT_KEY];
  } catch {
    // Unreadable storage reads as "nothing recorded": the announcement gets
    // treated as a baseline rather than triggering a reload.
    return undefined;
  }
}

/**
 * Records the given fingerprint as the one this extension instance is running.
 *
 * @param fingerprint - The fingerprint to record.
 */
async function setStoredFingerprint(fingerprint: string): Promise<void> {
  try {
    await browser.storage.session.set({ [FINGERPRINT_KEY]: fingerprint });
  } catch {
    // Swallow storage errors (e.g. the context being invalidated mid-reload)
    // so they don't surface as unhandled rejections.
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
  if (reloading) {
    return;
  }
  const stored = await getStoredFingerprint();
  // Re-check `reloading`: another announcement may have begun
  // a reload while this one was reading storage.
  if (reloading || stored === fingerprint) {
    return;
  }
  // Record before reloading: after the reload the new code receives the same
  // announcement again, finds it already recorded, and settles instead of
  // reloading in a loop.
  await setStoredFingerprint(fingerprint);
  if (stored === undefined) {
    // First announcement of this extension lifetime: the running code was just
    // loaded from the dev server's own output, so only record the baseline.
    return;
  }
  reloading = true;
  console.info('[webpack-dev-server] Background updated. Reloading...');
  // Wait for the close handshake so the impending teardown is not reported as
  // an unexpected disconnect by the dev server.
  await closeSocket(socket);
  browser.runtime.reload();
}

if (socketUrl) {
  connectToDevServer({
    url: socketUrl,
    isDone: () => reloading,
    onMessage: (type, data, socket) => {
      if (type === BACKGROUND_UPDATE_MESSAGE_TYPE && typeof data === 'string') {
        void onFingerprint(data, socket);
      }
    },
  });
}
