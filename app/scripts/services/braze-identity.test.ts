import { createBrazeIdentitySync, getBrazeIdentity } from './braze-identity';

jest.mock('../../braze/protocol', () => ({
  ...jest.requireActual('../../braze/protocol'),
  getBrazeConfig: () => ({
    apiKey: 'test-key',
    endpoint: 'sdk.test.braze.com',
  }),
}));

const makeSession = (canonicalProfileId: string) => ({
  token: { accessToken: 'test-token', expiresIn: 1, obtainedAt: 0 },
  profile: {
    identifierId: 'test-identifier',
    profileId: 'test-profile',
    metaMetricsId: 'test-metrics',
    canonicalProfileId,
  },
});

const state: Parameters<typeof getBrazeIdentity>[0] = {
  completedOnboarding: true,
  useExternalServices: true,
  isUiOpen: true,
  keyring: {
    isUnlocked: true,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [],
        metadata: { id: 'primary', name: 'Primary' },
      },
    ],
  },
  authentication: {
    isSignedIn: true,
    srpSessionData: {
      secondary: makeSession('secondary-profile'),
      primary: makeSession('primary-profile'),
    },
  },
};

describe('getBrazeIdentity', () => {
  it('selects the canonical profile of the primary HD keyring', () => {
    expect(getBrazeIdentity(state)).toBe('primary-profile');
  });

  it('does not fall back to another keyring profile', () => {
    expect(
      getBrazeIdentity({
        ...state,
        keyring: { ...state.keyring, keyrings: [] },
      }),
    ).toBeNull();
  });

  it('pauses identification while the UI is closed', () => {
    expect(getBrazeIdentity({ ...state, isUiOpen: false })).toBeNull();
  });

  it('does not identify when external services are disabled', () => {
    expect(
      getBrazeIdentity({
        ...state,
        useExternalServices: false,
      }),
    ).toBeNull();
  });
});

describe('createBrazeIdentitySync', () => {
  const makePort = () => ({
    postMessage: jest.fn(),
    disconnect: jest.fn(),
    onDisconnect: { addListener: jest.fn<void, [() => void]>() },
  });
  const connect = jest.fn(makePort);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: { offscreen: {}, runtime: { connect } },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'chrome');
  });

  it('opens a new port after a brief lock, even for the same profile', async () => {
    let current = state;
    const ready = Promise.resolve();
    const sync = createBrazeIdentitySync(() => current, ready);
    sync();
    expect(connect).not.toHaveBeenCalled();

    current = { ...state, isUiOpen: false };
    await ready;
    expect(connect).not.toHaveBeenCalled();

    current = state;
    sync();
    sync();
    current = { ...state, keyring: { ...state.keyring, isUnlocked: false } };
    sync();
    current = state;
    sync();

    const [beforeLock, afterUnlock] = connect.mock.results.map(
      ({ value }) => value,
    );
    beforeLock.onDisconnect.addListener.mock.calls[0][0]();
    sync();

    expect(connect).toHaveBeenCalledTimes(2);
    expect(beforeLock.postMessage.mock.calls).toStrictEqual([
      ['primary-profile'],
    ]);
    expect(beforeLock.disconnect).toHaveBeenCalledTimes(1);
    expect(afterUnlock.postMessage.mock.calls).toStrictEqual([
      ['primary-profile'],
    ]);
    expect(afterUnlock.disconnect).not.toHaveBeenCalled();
  });

  it('replaces the port on profile change and closes it when external services are disabled', async () => {
    let current = state;
    const ready = Promise.resolve();
    const sync = createBrazeIdentitySync(() => current, ready);
    await ready;

    current = {
      ...state,
      authentication: {
        ...state.authentication,
        srpSessionData: { primary: makeSession('new-profile') },
      },
    };
    sync();
    expect(connect).toHaveBeenCalledTimes(2);
    const [oldPort, newPort] = connect.mock.results.map(({ value }) => value);
    expect(oldPort.disconnect).toHaveBeenCalledTimes(1);
    expect(newPort.postMessage.mock.calls).toStrictEqual([['new-profile']]);

    current = { ...current, useExternalServices: false };
    sync();
    expect(newPort.disconnect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('retries on the next update after a failed send', async () => {
    const failedPort = makePort();
    failedPort.postMessage.mockImplementation(() => {
      throw new Error('Port closed');
    });
    connect.mockReturnValueOnce(failedPort);
    const ready = Promise.resolve();
    const sync = createBrazeIdentitySync(() => state, ready);
    await ready;

    expect(failedPort.disconnect).toHaveBeenCalledTimes(1);
    sync();
    expect(connect).toHaveBeenCalledTimes(2);
    expect(connect.mock.results[1].value.postMessage.mock.calls).toStrictEqual([
      ['primary-profile'],
    ]);
  });

  it('sends the current identity on the next connection after a disconnect', async () => {
    const ready = Promise.resolve();
    const sync = createBrazeIdentitySync(() => state, ready);
    await ready;
    connect.mock.results[0].value.onDisconnect.addListener.mock.calls[0][0]();
    sync();

    expect(connect).toHaveBeenCalledTimes(2);
    expect(connect.mock.results[1].value.postMessage.mock.calls).toStrictEqual([
      ['primary-profile'],
    ]);
  });
});
