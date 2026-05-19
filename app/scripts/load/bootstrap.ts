/* eslint-disable @typescript-eslint/no-require-imports */
// WARNING: This code runs outside of LavaMoat

// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

// In development + watch mode, connect to the webpack-dev-server's WebSocket.
// The `typeof window` guard keeps this no-op in the service-worker import of bootstrap
// (the dev-server client assumes a DOM and would throw on construction).
if (
  process.env.ENABLE_DEV_SERVER === 'true' &&
  typeof window !== 'undefined'
) {
  require('webpack-dev-server/client/index?protocol=ws&hostname=localhost&port=8080&pathname=/ws&hot=false&live-reload=true');
  // The query string is required because the extension page origin is
  // `chrome-extension://...`, so the client can't auto-detect the URL.
  // The port must match the one in `development/webpack/build.ts`.
}

require('../init-globals');

export {};
