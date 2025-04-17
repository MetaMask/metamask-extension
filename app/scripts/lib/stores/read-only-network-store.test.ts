import log from 'loglevel';
import nock from 'nock';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import ReadOnlyNetworkStore from './read-only-network-store';

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_ORIGIN = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}`;
const FIXTURE_SERVER_PATH = '/state.json';

const DEFAULT_INITIAL_STATE = {
  data: { config: {} },
};

const MOCK_STATE = { data: { config: { foo: 'bar' } }, meta: { version: 1 } };

/**
 * Initiatilizes a ReadOnlyNetworkStore for testing
 *
 * @returns store - a ReadOnlyNetworkStore
 */
function setupReadOnlyNetworkStore() {
  const store = new ReadOnlyNetworkStore();
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
function setMockFixtureServerReply(
  state: Record<string, unknown> = DEFAULT_INITIAL_STATE,
): void {
  mockFixtureServerInterceptor().reply(200, state);
}

describe('ReadOnlyNetworkStore', () => {
  beforeEach(() => {
    jest.resetModules();
    nock.cleanAll();
  });

  describe('constructor', () => {
    it('loads state from the network if fetch is successful and response is ok', async () => {
      setMockFixtureServerReply(MOCK_STATE);
      const store = setupReadOnlyNetworkStore();

      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });

    it('does not throw, and logs a debug message, if fetch is not okay', async () => {
      const logDebugSpy = jest
        .spyOn(log, 'debug')
        .mockImplementation(() => undefined);
      mockFixtureServerInterceptor().reply(400);
      const store = setupReadOnlyNetworkStore();

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
      const store = setupReadOnlyNetworkStore();

      const result = await store.get();

      expect(result).toBe(null);
      expect(logDebugSpy).toHaveBeenCalledWith(
        "Error loading network state: 'request to http://localhost:12345/state.json failed, reason: error!'",
      );
    });
  });

  describe('get', () => {
    it('returns null if #state is null', async () => {
      mockFixtureServerInterceptor().reply(200);
      const store = setupReadOnlyNetworkStore();

      const result = await store.get();

      expect(result).toBe(null);
    });

    it('returns null if state is null', async () => {
      setMockFixtureServerReply(MOCK_STATE);
      const store = setupReadOnlyNetworkStore();

      const result = await store.get();

      expect(result).toStrictEqual(MOCK_STATE);
    });
  });

  describe('set', () => {
    it('throws if not passed a state parameter', async () => {
      const store = setupReadOnlyNetworkStore();

      await expect(
        // @ts-expect-error Intentionally passing incorrect type
        store.set(undefined),
      ).rejects.toThrow('MetaMask - updated state is missing');
    });

    it('sets the state', async () => {
      const store = setupReadOnlyNetworkStore();

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
