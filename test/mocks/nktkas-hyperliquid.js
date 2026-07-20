/* eslint-env node */
/* eslint-disable import-x/unambiguous -- Jest manual mock uses `module.exports`; ESLint parses this glob as `sourceType: 'module'`. */
// Stub for the ESM-only `@nktkas/hyperliquid` SDK so Jest can resolve any
// module that imports it (e.g. the dedicated aggregated order-book connection)
// without loading the real bundle, which breaks Jest's default
// transformIgnorePatterns. Mirrors the `@metamask/perps-controller` stub.
//
// Tests that need to drive the subscription (assert on emitted data, exercise
// unsubscribe, etc.) should override this with their own `jest.mock()` factory.

class WebSocketTransport {
  constructor(options) {
    this.options = options;
    this.socket = new EventTarget();
  }

  ready() {
    return Promise.resolve();
  }

  subscribe() {
    return Promise.resolve({ unsubscribe: () => Promise.resolve() });
  }

  close() {
    return Promise.resolve();
  }
}

module.exports = { WebSocketTransport };
