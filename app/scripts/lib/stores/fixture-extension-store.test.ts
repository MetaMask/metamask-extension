import log from 'loglevel';
import nock from 'nock';
import browser from 'webextension-polyfill';
import { FixtureExtensionStore } from './fixture-extension-store';

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_ORIGIN = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}`;
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
});
