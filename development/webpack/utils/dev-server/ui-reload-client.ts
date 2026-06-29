import { connectToDevServer } from './connect-to-dev-server';
import {
  UI_HOT_UPDATE_MESSAGE_TYPE,
  UI_RELOAD_MESSAGE_TYPE,
} from './reload-protocol';

// `__resourceQuery` is the query string of the request that pulled this module
// in as an entry (e.g. `?url=ws%3A%2F%2Flocalhost%3A8080%2Fws`). webpack
// injects it per-module; the dev server fills it with its resolved WebSocket
// URL at server start (the port is only known then).
declare const __resourceQuery: string;

const socketUrl = new URLSearchParams(__resourceQuery.slice(1)).get('url');

// Storage key holding the UI build hash this page's code was loaded under.
// `globalThis.sessionStorage` (not `browser.storage.session`) on purpose: it is
// scoped to the tab, so concurrently open pages each keep their own record.
const HASH_KEY = 'MM_UI_RELOAD_HASH';

/**
 * @returns The UI build hash this page's code was loaded under, or `null` if
 * none has been recorded yet in this tab.
 */
function getStoredHash(): string | null {
  try {
    return globalThis.sessionStorage.getItem(HASH_KEY);
  } catch {
    // Unreadable storage reads as "nothing recorded": the announcement gets
    // treated as a baseline rather than triggering a hot update.
    return null;
  }
}

/**
 * Records the given UI build hash as the one this page is running.
 *
 * @param hash - The hash to record.
 */
function setStoredHash(hash: string): void {
  try {
    globalThis.sessionStorage.setItem(HASH_KEY, hash);
  } catch {
    // Without storage every announcement looks like a baseline, so the page
    // degrades to never hot-updating rather than hot-updating in a loop.
  }
}

/**
 * Handles a UI build-hash announcement from the dev server: posts a hot-update
 * message when the announced hash differs from the one this page's code was
 * loaded under. Announcements are state, not events — the server re-sends the
 * current hash to every (re)connecting client — so a build that completes
 * while this page is disconnected still takes effect once the page reconnects,
 * instead of being missed.
 *
 * @param hash - The announced hash of the server's latest UI build.
 */
function onHash(hash: string): void {
  const stored = getStoredHash();
  if (stored === hash) {
    return;
  }
  setStoredHash(hash);
  if (stored === null) {
    // First announcement this tab has seen: the page was just loaded from the
    // dev server's own output, so only record the baseline.
    return;
  }
  console.info('[webpack-dev-server] UI hot update...');
  globalThis.postMessage(
    { type: UI_HOT_UPDATE_MESSAGE_TYPE, hash },
    globalThis.location.origin,
  );
}

if (socketUrl) {
  connectToDevServer({
    url: socketUrl,
    onMessage: (type, data) => {
      if (type === UI_RELOAD_MESSAGE_TYPE && typeof data === 'string') {
        onHash(data);
      }
    },
  });
}
