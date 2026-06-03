import log from 'loglevel';
import nock from 'nock';
import browser from 'webextension-polyfill';
import * as manifestFlagsModule from '../manifestFlags';
import { BrowserStorageAdapter } from './browser-storage-adapter';
import { FixtureExtensionStore } from './fixture-extension-store';

jest.unmock('./browser-storage-adapter');

const FIXTURE_SERVER_HOST = 'localhost';
const DEFAULT_FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_ORIGIN = `http://${FIXTURE_SERVER_HOST}:${DEFAULT_FIXTURE_SERVER_PORT}`;
const FIXTURE_SERVER_PATH = '/state.json';

const DEFAULT_INITIAL_STATE = {
  data: { config: {} },
};

const MOCK_STATE = { data: { config: { foo: 'bar' } }, meta: { version: 1 } };

jest.mock('webextension-polyfill', () => {
  class MockBrowserStorage {
    #state: Record<string, unknown> = {};

    async get(keys?: string | string[] | null) {
      if (keys === null || typeof keys === 'undefined') {
        return this.#state;
      }
      if (typeof keys === 'string') {
        return Object.prototype.hasOwnProperty.call(this.#state, keys)
          ? { [keys]: this.#state[keys] }
          : {};
      }
      return Object.fromEntries(
        keys
          .filter((key) =>
            Object.prototype.hasOwnProperty.call(this.#state, key),
          )
          .map((key) => [key, this.#state[key]]),
      );
    }

    async set(value: Record<string, unknown>) {
      Object.assign(this.#state, value);
    }

    async clear() {
      this.#state = {};
    }

    async remove(keys: string | string[]) {
      const keysToRemove = Array.isArray(keys) ? keys : [keys];
      for (const key of keysToRemove) {
        delete this.#state[key];
      }
    }
  }

  return {
    runtime: { lastError: null },
    storage: { local: new MockBrowserStorage() },
  };
});

/**
 * Create a Nock scope for the fixture server response.
 *
 * @returns A Nock interceptor for the fixture server response.
 */
function mockFixtureServerInterceptor(): nock.Interceptor {
  return nock(FIXTURE_SERVER_ORIGIN).get(FIXTURE_SERVER_PATH);
}

/**
 * Create a Nock scope for the fixture server response, which will have a successful reply.
 *
 * @param state
 */
function setMockFixtureServerReply(
  state: Record<string, unknown> = DEFAULT_INITIAL_STATE,
): void {
  mockFixtureServerInterceptor().reply(200, state);
}

describe('FixtureExtensionStore', () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
    nock.cleanAll();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('skips initialization if initialize is not true', async () => {
      const interceptor =
        mockFixtureServerInterceptor().replyWithError('error!');
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);
      const store = new FixtureExtensionStore();

      const result = await store.get();

      expect(result).toStrictEqual({});
      expect(logDebugSpy).not.toHaveBeenCalled();
      expect(interceptor.isDone()).toBe(false);
    });

    it('loads state from the network if fetch is successful and response is ok', async () => {
      setMockFixtureServerReply(MOCK_STATE);
      const store = new FixtureExtensionStore({ initialize: true });

      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });

    it('does not throw, and logs a debug message, if fetch is not okay', async () => {
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);
      mockFixtureServerInterceptor().reply(400);
      const store = new FixtureExtensionStore({ initialize: true });

      const result = await store.get();

      expect(result).toStrictEqual({});
      expect(logDebugSpy).toHaveBeenCalledWith(
        'Received response with a status of 400 Bad Request',
      );
    });

    it('does not throw, and logs a debug message, if fetch throws an error', async () => {
      mockFixtureServerInterceptor().replyWithError('error!');
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);
      const store = new FixtureExtensionStore({ initialize: true });

      const result = await store.get();

      expect(result).toStrictEqual({});
      expect(logDebugSpy).toHaveBeenCalledWith(
        "Error loading network state: 'request to http://localhost:12345/state.json failed, reason: error!'",
      );
    });
  });

  describe('storageServiceData', () => {
    it('writes storageServiceData through generated BrowserStorageAdapter keys when present', async () => {
      const legacyKey = 'storageService:TokenListController:tokensChainsCache:0x1';
      const storageServiceEntries = {
        [legacyKey]: {
          timestamp: 1000,
          data: { '0xabc': { symbol: 'TKN' } },
        },
      };
      setMockFixtureServerReply({
        ...MOCK_STATE,
        storageServiceData: storageServiceEntries,
      });
      const store = new FixtureExtensionStore({ initialize: true });

      await store.get();
      const browserStorageAdapter = new BrowserStorageAdapter();
      const storageServiceResult = await browserStorageAdapter.getItem(
        'TokenListController',
        'tokensChainsCache:0x1',
      );
      const legacyValue = await browser.storage.local.get(legacyKey);

      expect(storageServiceResult).toStrictEqual({
        result: {
          timestamp: 1000,
          data: { '0xabc': { symbol: 'TKN' } },
        },
      });
      expect(legacyValue).toStrictEqual({});
    });

    it('continues writing storageServiceData entries when one generated entry fails', async () => {
      const storageServiceEntries = {
        'storageService:TokenListController:tokensChainsCache:0x1': {
          timestamp: 1000,
          data: { '0xabc': { symbol: 'TKN' } },
        },
        'storageService:TokenListController:tokensChainsCache:0x2': {
          timestamp: 2000,
          data: { '0xdef': { symbol: 'ALT' } },
        },
      };
      setMockFixtureServerReply({
        ...MOCK_STATE,
        storageServiceData: storageServiceEntries,
      });
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const originalSet = browser.storage.local.set.bind(browser.storage.local);
      const setSpy = jest
        .spyOn(browser.storage.local, 'set')
        .mockImplementation(async (value: unknown) => {
          if (
            typeof value === 'object' &&
            value !== null &&
            Object.keys(value).some((key) =>
              key.includes('tokensChainsCache%3A0x1'),
            )
          ) {
            throw new Error('generated entry failed');
          }
          await originalSet(value as Record<string, unknown>);
        });
      const store = new FixtureExtensionStore({ initialize: true });

      await store.get();
      const browserStorageAdapter = new BrowserStorageAdapter();
      const failedResult = await browserStorageAdapter.getItem(
        'TokenListController',
        'tokensChainsCache:0x1',
      );
      const successfulResult = await browserStorageAdapter.getItem(
        'TokenListController',
        'tokensChainsCache:0x2',
      );

      expect(setSpy).toHaveBeenCalled();
      expect(failedResult).toStrictEqual({});
      expect(successfulResult).toStrictEqual({
        result: {
          timestamp: 2000,
          data: { '0xdef': { symbol: 'ALT' } },
        },
      });
      expect(logDebugSpy).toHaveBeenCalledWith(
        "Error writing storage service fixture data key 'storageService:TokenListController:tokensChainsCache:0x1': 'generated entry failed'",
      );
    });

    it('does not write storageServiceData when it is empty', async () => {
      setMockFixtureServerReply({
        ...MOCK_STATE,
        storageServiceData: {},
      });
      const setSpy = jest.spyOn(browser.storage.local, 'set');
      const store = new FixtureExtensionStore({ initialize: true });

      await store.get();

      expect(setSpy).not.toHaveBeenCalledWith({});
    });

    it('does not write storageServiceData when it is absent', async () => {
      setMockFixtureServerReply(MOCK_STATE);
      const setSpy = jest.spyOn(browser.storage.local, 'set');
      const store = new FixtureExtensionStore({ initialize: true });

      await store.get();

      const storageServiceCalls = setSpy.mock.calls.filter(
        (call) =>
          call[0] !== null &&
          typeof call[0] === 'object' &&
          Object.keys(call[0] as object).some((k) =>
            k.startsWith('storageService:'),
          ),
      );
      expect(storageServiceCalls).toHaveLength(0);
    });
  });

  describe('get', () => {
    it('returns fixture state after waiting for init', async () => {
      setMockFixtureServerReply(MOCK_STATE);
      const store = new FixtureExtensionStore({ initialize: true });

      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });
  });

  describe('set', () => {
    it('sets the state', async () => {
      const store = new FixtureExtensionStore({ initialize: true });

      await store.set({
        data: { appState: { test: true } },
        meta: { version: 10 },
      });
      const result = await store.get();

      expect(result).toStrictEqual({
        data: { appState: { test: true } },
        meta: { version: 10 },
      });
    });
  });

  describe('dynamic port resolution', () => {
    it('fetches from manifest flag port when fixtureServerPort is set', async () => {
      const customPort = 52860;
      jest.spyOn(manifestFlagsModule, 'getManifestFlags').mockReturnValue({
        testing: { fixtureServerPort: customPort },
      });
      nock(`http://${FIXTURE_SERVER_HOST}:${customPort}`)
        .get(FIXTURE_SERVER_PATH)
        .reply(200, MOCK_STATE);

      const store = new FixtureExtensionStore({ initialize: true });
      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });

    it('falls back to default port when fixtureServerPort is absent', async () => {
      jest
        .spyOn(manifestFlagsModule, 'getManifestFlags')
        .mockReturnValue({ testing: {} });
      setMockFixtureServerReply(MOCK_STATE);

      const store = new FixtureExtensionStore({ initialize: true });
      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });

    it('falls back to default port when fixtureServerPort is invalid', async () => {
      jest.spyOn(manifestFlagsModule, 'getManifestFlags').mockReturnValue({
        testing: { fixtureServerPort: -1 },
      });
      setMockFixtureServerReply(MOCK_STATE);

      const store = new FixtureExtensionStore({ initialize: true });
      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });

    it('falls back to default port when getManifestFlags throws', async () => {
      jest
        .spyOn(manifestFlagsModule, 'getManifestFlags')
        .mockImplementation(() => {
          throw new Error('manifest not available');
        });
      setMockFixtureServerReply(MOCK_STATE);

      const store = new FixtureExtensionStore({ initialize: true });
      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });
  });
});
