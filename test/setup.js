require('@babel/register');
require('ts-node').register({ transpileOnly: true });

require('./helpers/setup-helper');

// Ensure `crypto.randomUUID` exists in the test environment (some Jest
// environments don't expose the webcrypto `crypto.randomUUID` even on Node 18+).
// Provide a safe polyfill that prefers Node's `crypto.randomUUID` and falls
// back to a UUIDv4 implementation using `randomBytes`.
try {
  if (
    !globalThis.crypto ||
    typeof globalThis.crypto.randomUUID !== 'function'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');

    if (!globalThis.crypto) {
      // eslint-disable-next-line no-undef
      globalThis.crypto = {};
    }

    if (typeof nodeCrypto.randomUUID === 'function') {
      // Prefer Node's implementation when available
      // eslint-disable-next-line no-undef
      globalThis.crypto.randomUUID = nodeCrypto.randomUUID.bind(nodeCrypto);
    } else {
      // Fallback UUIDv4 implementation
      // eslint-disable-next-line no-undef
      globalThis.crypto.randomUUID = () => {
        const bytes = nodeCrypto.randomBytes(16);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = bytes.toString('hex');
        return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
      };
    }
  }
} catch (e) {
  // If polyfill fails for any reason, don't crash test setup — tests will
  // surface the issue instead.
}

global.platform = {
  // Required for: coin overviews components
  openTab: () => undefined,
  // Required for: settings info tab
  getVersion: () => '<version>',
};

global.browser = {
  permissions: {
    request: jest.fn().mockResolvedValue(true),
  },
};
