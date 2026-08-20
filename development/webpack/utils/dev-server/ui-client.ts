import webpackHotEmitter from 'webpack/hot/emitter';
import 'webpack/hot/dev-server';
import { connectToDevServer } from './connect-to-dev-server';
import { UI_UPDATE_MESSAGE_TYPE } from './protocol';

// `__resourceQuery` is the query string of the request that imported this
// module (e.g. `?url=ws%3A%2F%2Flocalhost%3A8080%2Fws`). webpack injects it
// per-module; the dev server fills it with its resolved WebSocket URL at server
// start (the port is only known then).
declare const __resourceQuery: string;

const socketUrl = new URLSearchParams(__resourceQuery.slice(1)).get('url');

// webpack rewrites this runtime global to the hash of the currently loaded UI compilation.
// eslint-disable-next-line camelcase
declare const __webpack_hash__: string | undefined;

let requestedHash: string | null = null;

/**
 * @returns The webpack hash this UI page is currently running, if available.
 */
function getWebpackHash(): string | null {
  // eslint-disable-next-line camelcase
  return typeof __webpack_hash__ === 'string' ? __webpack_hash__ : null;
}

/**
 * Handles a UI build-hash announcement from the dev server. Announcements are
 * current state, not one-shot events, so compare them with the currently loaded
 * webpack runtime hash.
 *
 * @param hash - The announced hash of the server's latest UI build.
 */
function onHash(hash: string): void {
  if (getWebpackHash() === hash || requestedHash === hash) {
    return;
  }
  requestedHash = hash;
  console.info('[webpack-dev-server] UI hot update...');
  webpackHotEmitter.emit('webpackHotUpdate', hash);
}

if (socketUrl) {
  connectToDevServer({
    url: socketUrl,
    onMessage: (type, data) => {
      if (type === UI_UPDATE_MESSAGE_TYPE && typeof data === 'string') {
        onHash(data);
      }
    },
  });
}
