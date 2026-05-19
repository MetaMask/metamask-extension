/* eslint-disable @typescript-eslint/no-require-imports */
// WARNING: This code runs outside of LavaMoat

// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

// In development + watch mode, connect to the webpack-dev-server's WebSocket
// on UI pages only. We scope by the presence of `#app-content`, which is
// the React mount container used by `app/scripts/ui.js` — every page that
// renders the MetaMask UI has it (via `app/html/partials/partial-body.html`),
// and no other extension page does. This keeps the dev-server client out of
// the MV3 service worker, the Firefox MV2 persistent background page, the
// offscreen page, and other non-UI pages — reloading any of those when UI
// code rebuilds would break the message ports connecting them to the UI.
if (
  process.env.ENABLE_DEV_SERVER === 'true' &&
  typeof document !== 'undefined' &&
  document.getElementById('app-content')
) {
  require('webpack-dev-server/client/index?protocol=ws&hostname=localhost&port=8080&pathname=/ws&hot=false&live-reload=true');
  // The query string is required because the extension page origin is
  // `chrome-extension://...`, so the client can't auto-detect the URL.
  // The port must match the one in `development/webpack/build.ts`.
}

require('../init-globals');

export {};
