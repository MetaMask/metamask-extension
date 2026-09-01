import 'fake-indexeddb/auto';
import log from 'loglevel';
import nock from 'nock';
import browser from 'webextension-polyfill';
import * as manifestFlagsModule from '../manifestFlags';
import { FixtureExtensionStore } from './fixture-extension-store';
import { IndexedDBStore } from './indexeddb-store';

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
    #state: unknown = null;

    async get() {
      return this.#state;
    }

    async set(value: unknown) {
      this.#state = value;
    }

    async clear() {
      this.#state = null;
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

  describe('constructor', () => {
    it('skips initialization if initialize is not true', async () => {
      const interceptor =
        mockFixtureServerInterceptor().replyWithError('error!');
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);
      const store = new FixtureExtensionStore();

      const result = await store.get();

      expect(result).toBe(null);
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

      expect(result).toBe(null);
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

      expect(result).toBe(null);
      expect(logDebugSpy).toHaveBeenCalledWith(
        "Error loading network state: 'request to http://localhost:12345/state.json failed, reason: error!'",
      );
    });
  });

  describe('storageServiceData', () => {
    it('writes storageServiceData to IndexedDB when present', async () => {
      const storageServiceEntries = {
        'storageService:TokenListController:tokensChainsCache:0x1': {
          timestamp: 1000,
          data: { '0xabc': { symbol: 'TKN' } },
        },
      };
      setMockFixtureServerReply({
        ...MOCK_STATE,
        storageServiceData: storageServiceEntries,
      });
      const setSpy = jest.spyOn(IndexedDBStore.prototype, 'set');
      const store = new FixtureExtensionStore({ initialize: true });

      await store.get();

      expect(setSpy).toHaveBeenCalledWith(storageServiceEntries);
    });

    it('does not write empty or absent storageServiceData', async () => {
      const setSpy = jest.spyOn(IndexedDBStore.prototype, 'set');
      for (const state of [
        { ...MOCK_STATE, storageServiceData: {} },
        MOCK_STATE,
      ]) {
        setMockFixtureServerReply(state);
        const store = new FixtureExtensionStore({ initialize: true });

        await store.get();
      }

      expect(setSpy).not.toHaveBeenCalled();
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
      const store = new FixtureExtensionStore();

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
