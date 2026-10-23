import { it } from '@jest/globals';
import {
  BrazeAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { captureException } from '../../shared/lib/sentry';
import type { BrazeSdk } from './braze-sdk';
import initBraze, { createBrazeHost } from './braze';

jest.mock('../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

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
  });

  it('does not call changeUser for the current user', async () => {
    const sdk = createSdk();
    const syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });

    await syncBrazeUser('canonical-123');
    await syncBrazeUser('canonical-123');

    expect(sdk.changeUser).toHaveBeenCalledTimes(1);
  });

  it('does not load the SDK to clear when Braze has no data', async () => {
    const loadSdk = jest.fn();
    const syncBrazeUser = createBrazeHost({ loadSdk });

    await syncBrazeUser(null);

    expect(loadSdk).not.toHaveBeenCalled();
  });

  it('loads the SDK to wipe data persisted by a previous document', async () => {
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

describe('initBraze', () => {
  const originalEnv = process.env;
  const extensionId = 'extension-id';
  const serviceWorkerUrl = `chrome-extension://${extensionId}/service-worker.js`;
  let listener: (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => boolean;

  beforeEach(() => {
    process.env = { ...originalEnv };
    configureBraze();
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {
        runtime: {
          id: extensionId,
          onMessage: {
            addListener: jest.fn((callback) => {
              listener = callback;
            }),
          },
        },
      },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const message = {
    target: OffscreenCommunicationTarget.brazeOffscreen,
    action: BrazeAction.syncUser,
    profileId: null,
  };

  it('does not listen when Braze is not configured', () => {
    delete process.env.BRAZE_WEB_API_KEY;

    initBraze();

    expect(chrome.runtime.onMessage.addListener).not.toHaveBeenCalled();
  });

  it('does not throw when registration fails', () => {
    jest
      .mocked(chrome.runtime.onMessage.addListener)
      .mockImplementationOnce(() => {
        throw new Error('registration failed');
      });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => initBraze()).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Braze initialization failed:',
      expect.any(Error),
    );
  });

  it('responds to the service worker', async () => {
    initBraze();
    const sendResponse = jest.fn();

    const handled = listener(
      message,
      { id: extensionId, url: serviceWorkerUrl },
      sendResponse,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handled).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it.each([
    [
      'a UI document',
      {
        id: extensionId,
        url: 'chrome-extension://extension-id/home.html',
        documentId: 'document-id',
      },
    ],
    [
      'a content script',
      { id: extensionId, url: serviceWorkerUrl, tab: { id: 1 } },
    ],
    ['another extension', { id: 'other-extension', url: serviceWorkerUrl }],
  ])('ignores messages from %s', (_, sender) => {
    initBraze();
    const sendResponse = jest.fn();

    expect(
      listener(message, sender as chrome.runtime.MessageSender, sendResponse),
    ).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it('ignores other offscreen messages', () => {
    initBraze();

    expect(
      listener(
        { target: OffscreenCommunicationTarget.trezorOffscreen },
        { id: extensionId, url: serviceWorkerUrl },
        jest.fn(),
      ),
    ).toBe(false);
    expect(captureException).not.toHaveBeenCalled();
  });
});
