import { connectToDevServer } from './connect-to-dev-server';
import { UI_RELOAD_MESSAGE_TYPE } from './reload-protocol';

// `__resourceQuery` is the query string of the request that pulled this module
// in as an entry (e.g. `?url=ws%3A%2F%2Flocalhost%3A8080%2Fws`). webpack
// injects it per-module; the dev server fills it with its resolved WebSocket
// URL at server start (the port is only known then).
declare const __resourceQuery: string;

const socketUrl = new URLSearchParams(__resourceQuery.slice(1)).get('url');

// Storage key holding the UI build hash this page's code was loaded under.
// `self.sessionStorage` (not `browser.storage.session`) on purpose: it is
// scoped to the tab, so concurrently open pages each keep their own record,
// and it survives the page reload — which is what lets the reloaded page
// settle instead of reloading in a loop.
const HASH_KEY = 'MM_UI_RELOAD_HASH';

/**
 * @returns The UI build hash this page's code was loaded under, or `null` if
 * none has been recorded yet in this tab.
 */
function getStoredHash(): string | null {
  try {
    return self.sessionStorage.getItem(HASH_KEY);
  } catch {
    // Unreadable storage reads as "nothing recorded": the announcement gets
    // treated as a baseline rather than triggering a reload.
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
    self.sessionStorage.setItem(HASH_KEY, hash);
  } catch {
    // Without storage every announcement looks like a baseline, so the page
    // degrades to never auto-reloading rather than reloading in a loop.
  }
}

let reloading = false;

/**
 * Handles a UI build-hash announcement from the dev server: reloads the page
 * when the announced hash differs from the one this page's code was loaded
 * under. Announcements are state, not events — the server re-sends the
 * current hash to every (re)connecting client — so a build that completes
 * while this page is reloading or disconnected still takes effect once the
 * new page connects, instead of being missed.
 *
 * @param hash - The announced hash of the server's latest UI build.
 * @param socket - The WebSocket the announcement arrived on.
 */
function onHash(hash: string, socket: WebSocket): void {
  const stored = getStoredHash();
  // Re-check `reloading`: another announcement may have begun
  // a reload while this one was reading storage.
  if (reloading || stored === hash) {
    return;
  }
  // Record before reloading: after the reload the new tab receives the same
  // announcement again, finds it already recorded, and settles instead of
  // reloading in a loop.
  setStoredHash(hash);
  if (stored === null) {
    // First announcement this tab has seen: the page was just loaded from the
    // dev server's own output, so only record the baseline.
    return;
  }
  reloading = true;
  console.info('[webpack-dev-server] UI updated. Reloading...');
  // Close first so the navigation isn't logged as an unexpected
  // disconnect, then reload the tab.
  socket.close();
  self.location.reload();
}

if (socketUrl) {
  connectToDevServer(
    socketUrl,
    () => reloading,
    (type, data, socket) => {
      if (type === UI_RELOAD_MESSAGE_TYPE && typeof data === 'string') {
        onHash(data, socket);
      }
    },
  );
}
