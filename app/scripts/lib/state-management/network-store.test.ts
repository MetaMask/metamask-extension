import nock from 'nock';
import log from 'loglevel';
import ReadOnlyNetworkStore from './network-store';

// The URL that will be used in the fetch call
const FIXTURE_SERVER_URL = 'http://localhost:12345';
const mockState: Record<string, unknown> = { key: 'value' };
const mockMetadata: Record<string, unknown> = { version: 1 };

describe('ReadOnlyNetworkStore', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch the state from the server and store it', async () => {
    nock(FIXTURE_SERVER_URL).get('/state.json').reply(200, mockState);
    const store = new ReadOnlyNetworkStore();
    await store.get();
    expect(store.mostRecentRetrievedState).toEqual(mockState);
  });

  it('should log an error if the server returns an error', async () => {
    nock(FIXTURE_SERVER_URL).get('/state.json').replyWithError('Network error');
    const logSpy = jest.spyOn(log, 'debug').mockImplementation(() => {
      return null;
    });
    const store = new ReadOnlyNetworkStore();
    await store.get();
    expect(logSpy).toHaveBeenCalledWith(
      "Error loading network state: 'request to http://localhost:12345/state.json failed, reason: Network error'",
    );
    logSpy.mockRestore();
  });

  it('should set metadata and retrieve it', () => {
    const store = new ReadOnlyNetworkStore();
    store.setMetadata(mockMetadata);
    expect(store.metadata).toEqual(mockMetadata);
  });

  it('should throw an error when setting state without metadata', async () => {
    const store = new ReadOnlyNetworkStore();
    await expect(store.set(mockState)).rejects.toThrow(
      'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
    );
  });

  it('should throw an error when setting an empty state', async () => {
    const store = new ReadOnlyNetworkStore();
    store.setMetadata(mockMetadata); // Ensure metadata is set to bypass previous check
    await expect(
      store.set(undefined as unknown as Record<string, unknown>),
    ).rejects.toThrow('MetaMask - updated state is missing');
  });

  it('should set the state when metadata is present and state is valid', async () => {
    const store = new ReadOnlyNetworkStore();
    store.setMetadata(mockMetadata);
    await store.set(mockState);

    expect(store._state).toEqual({
      data: mockState,
      meta: mockMetadata,
    });
  });

  it('should clear the most recent retrieved state when cleanUpMostRecentRetrievedState is called', () => {
    const store = new ReadOnlyNetworkStore();
    store.mostRecentRetrievedState = mockState;
    store.cleanUpMostRecentRetrievedState();
    expect(store.mostRecentRetrievedState).toBeNull();
  });
});
