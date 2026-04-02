/**
 * Vitest setup file — mirrors test/setup.js + test/jest/setup.js + helpers.
 *
 * Runs before every test file. Equivalent to Jest's setupFiles +
 * setupFilesAfterEnv combined.
 */
import { vi } from 'vitest';
import { createRequire } from 'module';
import 'fake-indexeddb/auto';

// ── Sync shim for jest.requireActual used outside vi.mock factories ─────────
// Inside vi.mock factories the plugin inserts `await vi.importActual()`.
// Outside factories (e.g. helpers, inline test code) we need a sync fallback.
const _require = createRequire(import.meta.url);
(globalThis as any).__vitest_requireActual = (moduleName: string) => {
  try {
    return _require(moduleName);
  } catch {
    throw new Error(
      `__vitest_requireActual: cannot synchronously require "${moduleName}". ` +
        `Move this call inside a vi.mock factory or use await vi.importActual().`,
    );
  }
};
import nock from 'nock';
import '@testing-library/jest-dom/vitest';

// ── process.env stubs (from setup-helper.js) ───────────────────────────────
process.env.IN_TEST = 'true';
process.env.METAMASK_BUILD_TYPE = 'main';

// ── global.chrome stub (from setup-helper.js) ──────────────────────────────
(globalThis as any).chrome = {
  runtime: {
    id: 'testid',
    getManifest: () => ({ manifest_version: 2 }),
    sendMessage: () => {},
    onMessage: { addListener: () => {} },
  },
};

// ── global.sentry stub (from setup-helper.js) ──────────────────────────────
(globalThis as any).sentry = {
  captureException: () => {},
  captureFeedback: () => {},
  captureMessage: () => {},
  lastEventId: () => {},
};

// ── global.platform stub (from test/setup.js) ──────────────────────────────
(globalThis as any).platform = {
  openTab: () => undefined,
  getVersion: () => '<version>',
};

// ── global.browser stub (from test/setup.js) ────────────────────────────────
(globalThis as any).browser = {
  permissions: { request: vi.fn().mockResolvedValue(true) },
};

// ── nock config (from setup-helper.js + setup-after-helper.js) ──────────────
nock.disableNetConnect();
nock.enableNetConnect('localhost');

beforeEach(() => {
  nock.cleanAll();
});

// ── global.prompt (from setup-after-helper.js) ──────────────────────────────
(globalThis as any).prompt = () => undefined;

// ── setImmediate / clearImmediate polyfill ───────────────────────────────────
(globalThis as any).setImmediate =
  (globalThis as any).setImmediate ||
  ((fn: (...a: any[]) => void, ...args: any[]) =>
    globalThis.setTimeout(fn, 0, ...args));
(globalThis as any).clearImmediate =
  (globalThis as any).clearImmediate ||
  ((id: any) => globalThis.clearTimeout(id));

// ── popover-content anchor (from setup-helper.js) ───────────────────────────
if (typeof document !== 'undefined') {
  const el = document.createElement('div');
  el.setAttribute('id', 'popover-content');
  document.body.appendChild(el);
}

// ── matchMedia stub (from setup-helper.js) ──────────────────────────────────
if (typeof window !== 'undefined' && !window.matchMedia) {
  (window as any).matchMedia = (q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  });
}

// ── requestAnimationFrame, scrollIntoView, SVGPathElement ───────────────────
if (typeof window !== 'undefined') {
  if (!(window as any).requestAnimationFrame) {
    (window as any).requestAnimationFrame = () => undefined;
  }
  HTMLElement.prototype.scrollIntoView =
    HTMLElement.prototype.scrollIntoView || (() => undefined);
  if (!(window as any).SVGPathElement) {
    (window as any).SVGPathElement = { prototype: {} };
  }
}

// ── ResizeObserver stub ─────────────────────────────────────────────────────
if (typeof ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ── Module mocks (from test/jest/setup.js + setup-after-helper.js) ──────────
vi.mock('webextension-polyfill', () => ({
  runtime: {
    getManifest: () => ({ manifest_version: 3 }),
    onMessage: {
      removeListener: vi.fn(),
      addListener: vi.fn(),
    },
  },
}));

vi.mock('../app/scripts/lib/stores/browser-storage-adapter', async () => {
  const { InMemoryStorageAdapter } = await vi.importActual<any>(
    '@metamask/storage-service',
  );
  return { BrowserStorageAdapter: InMemoryStorageAdapter };
});

// ── Custom matchers (from test/jest/setup.js) ───────────────────────────────
const UNRESOLVED = Symbol('timedOut');
const originalSetTimeout = globalThis.setTimeout;
const TIME_TO_WAIT_UNTIL_UNRESOLVED = 100;

function treatUnresolvedAfter(duration: number) {
  return new Promise((resolve) => {
    originalSetTimeout(resolve, duration, UNRESOLVED);
  });
}

expect.extend({
  async toBeFulfilled(received: Promise<any>) {
    let rejectionValue: any = UNRESOLVED;
    try {
      await received;
    } catch (e) {
      rejectionValue = e;
    }
    if (rejectionValue !== UNRESOLVED) {
      return {
        message: () =>
          `Expected promise to be fulfilled, but it was rejected with ${rejectionValue}.`,
        pass: false,
      };
    }
    return {
      message: () => 'Expected promise not to be fulfilled, but it was.',
      pass: true,
    };
  },

  async toNeverResolve(received: Promise<any>) {
    let resolutionValue: any;
    let rejectionValue: any;
    try {
      resolutionValue = await Promise.race([
        received,
        treatUnresolvedAfter(TIME_TO_WAIT_UNTIL_UNRESOLVED),
      ]);
    } catch (e) {
      rejectionValue = e;
    }
    return resolutionValue === UNRESOLVED
      ? {
          message: () =>
            `Expected promise to resolve after ${TIME_TO_WAIT_UNTIL_UNRESOLVED}ms, but it did not`,
          pass: true,
        }
      : {
          message: () =>
            `Expected promise to never resolve after ${TIME_TO_WAIT_UNTIL_UNRESOLVED}ms, but it ${
              rejectionValue
                ? `was rejected with ${rejectionValue}`
                : `resolved with ${resolutionValue}`
            }`,
          pass: false,
        };
  },
});

// ── loglevel (from setup-helper.js) ─────────────────────────────────────────
import log from 'loglevel';
log.setDefaultLevel(5);
(globalThis as any).log = log;
