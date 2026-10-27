import { it } from '@jest/globals';
import type { BrazeSdk } from './braze-sdk';
import { createBrazeHost } from './braze-host';

const createSdk = () => {
  let initialized = false;
  let userId: string | null = null;
  const sdk = {
    initialize: jest.fn(() => {
      initialized = true;
      return true;
    }),
    isInitialized: jest.fn(() => initialized),
    getUser: jest.fn(() => (initialized ? { getUserId: () => userId } : null)),
    changeUser: jest.fn((id: string) => {
      userId = id;
    }),
    requestImmediateDataFlush: jest.fn(),
    wipeData: jest.fn(() => {
      userId = null;
    }),
    destroy: jest.fn(() => {
      initialized = false;
    }),
  };
  return sdk as typeof sdk & BrazeSdk;
};

const configureBraze = () => {
  process.env.BRAZE_WEB_API_KEY = 'test-key';
  process.env.BRAZE_SDK_ENDPOINT = 'sdk.example.com';
  delete process.env.IN_TEST;
};

describe('createBrazeHost', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    configureBraze();
    process.env.METAMASK_VERSION = '13.55.0';
    delete process.env.METAMASK_DEBUG;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('initializes with extension-safe options and identifies the user', async () => {
    const sdk = createSdk();
    const syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });

    await syncBrazeUser('canonical-123');

    expect(sdk.initialize).toHaveBeenCalledWith('test-key', {
      baseUrl: 'sdk.example.com',
      enableLogging: false,
      noCookies: true,
      doNotLoadFontAwesome: true,
      allowUserSuppliedJavascript: false,
      manageServiceWorkerExternally: true,
      disablePushTokenMaintenance: true,
      appVersion: '13.55.0',
    });
    expect(sdk.changeUser).toHaveBeenCalledWith('canonical-123');
    expect(sdk.requestImmediateDataFlush).toHaveBeenCalled();
  });

  it('does not call changeUser for the current user', async () => {
    const sdk = createSdk();
    const syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });

    await syncBrazeUser('canonical-123');
    await syncBrazeUser('canonical-123');

    expect(sdk.changeUser).toHaveBeenCalledTimes(1);
    expect(sdk.requestImmediateDataFlush).toHaveBeenCalledTimes(2);
  });

  it('does not load the SDK to clear when Braze has no data', async () => {
    const loadSdk = jest.fn();
    const syncBrazeUser = createBrazeHost({ loadSdk });

    await syncBrazeUser(null);

    expect(loadSdk).not.toHaveBeenCalled();
  });

  it('loads the SDK to wipe data persisted by a previous host', async () => {
    localStorage.setItem('ab.storage.userId.test-key', '{"v":"canonical-123"}');
    const sdk = createSdk();
    const syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });

    try {
      await syncBrazeUser(null);
    } finally {
      localStorage.clear();
    }

    expect(sdk.initialize).toHaveBeenCalled();
    expect(sdk.wipeData).toHaveBeenCalled();
    expect(sdk.destroy).toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.requestImmediateDataFlush).not.toHaveBeenCalled();
  });

  it('wipes data before destroying the SDK', async () => {
    const sdk = createSdk();
    const syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });
    await syncBrazeUser('canonical-123');

    await syncBrazeUser(null);

    expect(sdk.wipeData.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.destroy.mock.invocationCallOrder[0],
    );
  });

  it('still destroys the SDK when wiping throws', async () => {
    const sdk = createSdk();
    sdk.wipeData.mockImplementationOnce(() => {
      throw new Error('wipe failed');
    });
    const syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });
    await syncBrazeUser('canonical-123');

    await expect(syncBrazeUser(null)).rejects.toThrow('wipe failed');
    expect(sdk.destroy).toHaveBeenCalled();
  });

  it('applies only the latest user while the SDK is loading', async () => {
    const sdk = createSdk();
    let resolveLoad: (value: BrazeSdk) => void = () => undefined;
    const syncBrazeUser = createBrazeHost({
      loadSdk: () =>
        new Promise<BrazeSdk>((resolve) => {
          resolveLoad = resolve;
        }),
    });

    const identify = syncBrazeUser('canonical-123');
    const clear = syncBrazeUser(null);
    resolveLoad(sdk);
    await Promise.all([identify, clear]);

    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.isInitialized()).toBe(false);
  });

  it('throws when the SDK does not initialize', async () => {
    const sdk = createSdk();
    sdk.initialize.mockReturnValueOnce(false);
    const syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });

    await expect(syncBrazeUser('canonical-123')).rejects.toThrow(
      'Braze SDK failed to initialize',
    );
    expect(sdk.requestImmediateDataFlush).not.toHaveBeenCalled();
  });

  it('retries a failed SDK load', async () => {
    const sdk = createSdk();
    const loadSdk = jest
      .fn()
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValueOnce(sdk);
    const syncBrazeUser = createBrazeHost({ loadSdk });

    await expect(syncBrazeUser('canonical-123')).rejects.toThrow(
      'chunk failed',
    );
    await syncBrazeUser('canonical-123');

    expect(sdk.changeUser).toHaveBeenCalledWith('canonical-123');
  });
});
