import 'fake-indexeddb/auto';
import { Buffer as NodeBuffer } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import {
  URL as NodeURL,
  URLSearchParams as NodeURLSearchParams,
} from 'node:url';
import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from 'node:util';
import nock from 'nock';
import log from 'loglevel';
import nodeFetch, {
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
} from 'node-fetch';

process.env.IN_TEST = 'true';
process.env.METAMASK_BUILD_TYPE = 'main';

const TextEncoderUint8Array = new NodeTextEncoder().encode('').constructor;

Object.defineProperty(globalThis, 'Uint8Array', {
  value: TextEncoderUint8Array,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'TextEncoder', {
  value: NodeTextEncoder,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'TextDecoder', {
  value: NodeTextDecoder,
  configurable: true,
  writable: true,
});

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

vi.mock('../../app/scripts/services/oauth/web-authenticator-factory', () => ({
  webAuthenticatorFactory: () => {
    const nonce = Math.random().toString(36).substring(2, 15);
    const state = JSON.stringify({ nonce });
    return {
      generateNonce: () => nonce,
      launchWebAuthFlow: (
        _options: Record<string, unknown>,
        callback?: (url: string) => void,
      ) =>
        Promise.resolve(
          callback?.(
            `https://mock-redirect-url.com?nonce=${nonce}&state=${state}&code=mock-code`,
          ),
        ),
      generateCodeVerifierAndChallenge: () =>
        Promise.resolve({
          codeVerifier: 'mock-code-verifier',
          challenge: 'mock-challenge',
        }),
      getRedirectURL: () => 'https://mock-redirect-url.com',
    };
  },
  getIdentityAPI: () => globalThis.chrome?.identity ?? globalThis.browser?.identity,
}));

(globalThis as typeof globalThis & { self?: typeof globalThis }).self ??=
  globalThis;

if (typeof window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: {
      navigator: {
        userAgent:
          'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      localStorage: createMemoryStorage(),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
    configurable: true,
  });
}

if (typeof window !== 'undefined' && !window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
  });
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: window.localStorage,
    configurable: true,
  });
}

if (typeof window !== 'undefined') {
  const navigatorWithClipboard = window.navigator as Navigator & {
    clipboard?: {
      writeText?: (text: string) => Promise<void> | void;
    };
  };
  if (!navigatorWithClipboard.clipboard) {
    Object.defineProperty(navigatorWithClipboard, 'clipboard', {
      value: {},
      configurable: true,
      writable: true,
    });
  }
  if (!navigatorWithClipboard.clipboard?.writeText) {
    Object.defineProperty(navigatorWithClipboard.clipboard, 'writeText', {
      value: () => undefined,
      configurable: true,
      writable: true,
    });
  }
}

global.chrome = {
  runtime: {
    id: 'testid',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    getManifest: () => ({ manifest_version: 2 }),
    sendMessage: () => undefined,
    onMessage: { addListener: () => undefined },
  },
};

global.sentry = {
  captureException: () => undefined,
  captureFeedback: () => undefined,
  captureMessage: () => undefined,
  lastEventId: () => undefined,
};

nock.disableNetConnect();
nock.enableNetConnect('localhost');
beforeEach(() => nock.cleanAll());

const processWithUnhandledSetup = process as typeof process & {
  ['__metamaskVitestUnhandledSetup']?: boolean;
  ['__metamaskVitestUnhandledRejections']?: Map<Promise<unknown>, unknown>;
  ['__metamaskVitestIgnoreUnhandled']?: boolean;
};

const unhandledRejections =
  processWithUnhandledSetup.__metamaskVitestUnhandledRejections ??
  new Map<Promise<unknown>, unknown>();
processWithUnhandledSetup.__metamaskVitestUnhandledRejections =
  unhandledRejections;
processWithUnhandledSetup.__metamaskVitestIgnoreUnhandled ??= false;

if (!processWithUnhandledSetup.__metamaskVitestUnhandledSetup) {
  process.on('unhandledRejection', (reason, promise) => {
    if (!processWithUnhandledSetup.__metamaskVitestIgnoreUnhandled) {
      console.log(
        `Unhandled rejection: ..${process.env.IGNORE_UNHANDLED}`,
        reason,
      );
      unhandledRejections.set(promise, reason);
    }
  });
  process.on('rejectionHandled', (promise) => {
    if (!processWithUnhandledSetup.__metamaskVitestIgnoreUnhandled) {
      console.log(`handled: ${String(unhandledRejections.get(promise))}`);
      unhandledRejections.delete(promise);
    }
  });
  process.on('exit', () => {
    if (unhandledRejections.size > 0) {
      console.error(`Found ${unhandledRejections.size} unhandled rejections:`);
      for (const reason of unhandledRejections.values()) {
        console.error('Unhandled rejection: ', reason);
      }
      process.exit(1);
    }
  });
  processWithUnhandledSetup.__metamaskVitestUnhandledSetup = true;
}

process.resetIgnoreUnhandled = () => {
  processWithUnhandledSetup.__metamaskVitestIgnoreUnhandled = false;
};
process.setIgnoreUnhandled = (ignore: boolean) => {
  processWithUnhandledSetup.__metamaskVitestIgnoreUnhandled = ignore;
};

log.setDefaultLevel(5);
global.log = log;

Object.defineProperty(globalThis, 'Buffer', {
  value: NodeBuffer,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  configurable: true,
});

global.URL = NodeURL as unknown as typeof global.URL;
global.URLSearchParams =
  NodeURLSearchParams as unknown as typeof global.URLSearchParams;

const ensurePerformanceMark = (performanceObject: unknown) => {
  const performanceWithMark = performanceObject as {
    mark?: (markName: string) => void;
  };

  if (
    performanceWithMark &&
    typeof performanceWithMark.mark !== 'function'
  ) {
    Object.defineProperty(performanceWithMark, 'mark', {
      value: () => undefined,
      configurable: true,
      writable: true,
    });
  }
};

ensurePerformanceMark(globalThis.performance);
if (typeof window !== 'undefined') {
  ensurePerformanceMark(window.performance);
}

global.fetch = nodeFetch as unknown as typeof fetch;
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'Uint8Array', {
    value: TextEncoderUint8Array,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'TextEncoder', {
    value: NodeTextEncoder,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'TextDecoder', {
    value: NodeTextDecoder,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'Buffer', {
    value: NodeBuffer,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'crypto', {
    value: globalThis.crypto,
    configurable: true,
  });
  Object.defineProperty(window, 'fetch', {
    value: nodeFetch,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'Headers', {
    value: NodeHeaders,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'Request', {
    value: NodeRequest,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'Response', {
    value: NodeResponse,
    configurable: true,
    writable: true,
  });
}

global.setImmediate =
  global.setImmediate ??
  ((fn: (...args: unknown[]) => void, ...args: unknown[]) =>
    global.setTimeout(fn, 0, ...args));
global.clearImmediate =
  global.clearImmediate ??
  ((id: ReturnType<typeof setTimeout>) => global.clearTimeout(id));

global.platform = {
  openTab: () => undefined,
  getVersion: () => '<version>',
};

global.browser = {
  permissions: {
    request: vi.fn().mockResolvedValue(true),
  },
};

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  });
}

if (typeof window !== 'undefined' && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = () => undefined;

  Object.defineProperty(window.HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => 0,
  });
}

// ResizeObserver is not available in JSDOM.
if (
  typeof window !== 'undefined' &&
  typeof window.ResizeObserver === 'undefined'
) {
  class MockResizeObserver {
    observe() {
      // no-op for tests
    }

    unobserve() {
      // no-op for tests
    }

    disconnect() {
      // no-op for tests
    }
  }

  window.ResizeObserver = MockResizeObserver;
  global.ResizeObserver = MockResizeObserver;
}

if (
  typeof document !== 'undefined' &&
  !document.getElementById('popover-content')
) {
  const popoverContent = document.createElement('div');
  popoverContent.setAttribute('id', 'popover-content');
  document.body.appendChild(popoverContent);
}
