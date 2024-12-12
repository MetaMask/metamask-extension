import log from 'loglevel';
import nock from 'nock';
import Migrator from '../migrator';
import ReadOnlyNetworkStore from './ReadOnlyNetworkStore';
import { IntermediaryStateType } from './BaseStore';

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_ORIGIN = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}`;
const FIXTURE_SERVER_PATH = '/state.json';

const DEFAULT_INITIAL_STATE = {
  data: { config: {} },
  meta: { version: 0 },
};

const MOCK_STATE = { data: { config: { foo: 'bar' } }, meta: { version: 1 } };

/**
 * Initiatilizes a ReadOnlyNetworkStore for testing
 *
 * @returns store - a ReadOnlyNetworkStore
 */
function setupReadOnlyNetworkStore() {
  const migrator = new Migrator();
  const store = new ReadOnlyNetworkStore({ migrator });
  return store;
}

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
function setMockFixtureServerReply(state = DEFAULT_INITIAL_STATE) {
  mockFixtureServerInterceptor().reply(200, state);
}

describe('ReadOnlyNetworkStore', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('constructor', () => {
    it('initializes with correct default properties', () => {
      const store = setupReadOnlyNetworkStore();
      expect(store.mostRecentRetrievedState).toBeNull();
      expect(store.stateCorruptionDetected).toBe(false);
      expect(store.dataPersistenceFailing).toBe(false);
      expect(store.firstTimeInstall).toBe(false);
      expect(store.isSupported).toBe(true);
    });
  });

  describe('initialization (#init)', () => {
    it('loads state from the network if fetch is successful and response is ok', async () => {
      setMockFixtureServerReply(MOCK_STATE);
      const store = setupReadOnlyNetworkStore();
      const result = await store.get();
      expect(result).toStrictEqual(MOCK_STATE);
      expect(store.mostRecentRetrievedState).toStrictEqual(MOCK_STATE);
    });

    it('does not throw, and logs a debug message, if fetch is not okay', async () => {
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);

      mockFixtureServerInterceptor().reply(400);

      const store = setupReadOnlyNetworkStore();
      const result = await store.get();
      expect(result).toStrictEqual(DEFAULT_INITIAL_STATE);
      expect(store.mostRecentRetrievedState).toStrictEqual(null);
      expect(logDebugSpy).toHaveBeenCalledWith(
        'Received response with a status of 400 Bad Request',
      );
    });

    it('does not throw, and logs a debug message, if fetch throws an error', async () => {
      mockFixtureServerInterceptor().replyWithError('error!');
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);

      const store = setupReadOnlyNetworkStore();
      const result = await store.get();
      expect(result).toStrictEqual(DEFAULT_INITIAL_STATE);
      expect(store.mostRecentRetrievedState).toStrictEqual(null);
      expect(logDebugSpy).toHaveBeenCalledWith(
        "Error loading network state: 'request to http://localhost:12345/state.json failed, reason: error!'",
      );
    });
  });

  describe('get', () => {
    it('returns fallback state if #state is null', async () => {
      const store = setupReadOnlyNetworkStore();
      const result = await store.get();
      expect(result).toStrictEqual(DEFAULT_INITIAL_STATE);
      expect(store.mostRecentRetrievedState).toStrictEqual(null);
    });

    it('returns fallback state if #state not have data', async () => {
      setMockFixtureServerReply({ ...MOCK_STATE, data: null });

      const store = setupReadOnlyNetworkStore();
      const result = await store.get();
      expect(result).toStrictEqual(DEFAULT_INITIAL_STATE);
      expect(store.mostRecentRetrievedState).toStrictEqual(null);
    });

    it('returns stored state if #state has data', async () => {
      setMockFixtureServerReply(MOCK_STATE);

      const store = setupReadOnlyNetworkStore();
      const result = await store.get();
      expect(result).toStrictEqual(MOCK_STATE);
    });

    it('does not overwrite mostRecentRetrievedState once set', async () => {
      setMockFixtureServerReply(MOCK_STATE);

      const store = setupReadOnlyNetworkStore();
      await store.get(); // sets mostRecentRetrievedState
      // Calling it again should not change mostRecentRetrievedState since it's already set
      await store.get();
      expect(store.mostRecentRetrievedState).toStrictEqual(MOCK_STATE);
    });
  });

  describe('set', () => {
    it('throws if not passed a state parameter', async () => {
      const store = setupReadOnlyNetworkStore();
      await expect(
        store.set(undefined as unknown as IntermediaryStateType),
      ).rejects.toThrow('MetaMask - updated state is missing');
    });

    it('throws if metadata has not yet been set', async () => {
      const store = setupReadOnlyNetworkStore();
      await expect(store.set({ appState: { test: true } })).rejects.toThrow(
        'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
      );
    });

    it('sets the state if metadata is set and store is supported', async () => {
      const store = setupReadOnlyNetworkStore();
      store.metadata = { version: 10 };
      await store.set({ appState: { test: true } });
      const result = await store.get();
      expect(result).toStrictEqual({
        data: { appState: { test: true } },
        meta: { version: 10 },
      });
    });

    it('throws if browser is not supported (though isSupported is always true)', async () => {
      const store = setupReadOnlyNetworkStore();
      store.isSupported = false;
      await expect(store.set({ appState: { test: true } })).rejects.toThrow(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    });
  });

  describe('isFirstTimeInstall', () => {
    it('returns true if get() returns null (theoretically), otherwise false', async () => {
      const store = setupReadOnlyNetworkStore();
      const result = await store.isFirstTimeInstall();
      expect(result).toBe(false);
    });
  });

  describe('cleanUpMostRecentRetrievedState', () => {
    it('sets mostRecentRetrievedState to null if it is defined', async () => {
      const store = setupReadOnlyNetworkStore();
      await store.get();
      store.cleanUpMostRecentRetrievedState();
      expect(store.mostRecentRetrievedState).toBeNull();
    });

    it('does nothing if mostRecentRetrievedState is already null', async () => {
      const store = setupReadOnlyNetworkStore();
      expect(store.mostRecentRetrievedState).toBeNull();
      store.cleanUpMostRecentRetrievedState();
      expect(store.mostRecentRetrievedState).toBeNull();
    });
  });
});
