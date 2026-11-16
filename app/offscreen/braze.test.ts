import { it } from '@jest/globals';
import {
  BrazeAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { captureException } from '../../shared/lib/sentry';
import initBraze from './braze';

jest.mock('../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockHost = {
  syncUser: jest.fn(),
  getBanner: jest.fn(),
  logBannerInteraction: jest.fn(),
};
jest.mock('../braze/braze-host', () => ({
  createBrazeHost: () => mockHost,
}));

const configureBraze = () => {
  process.env.BRAZE_WEB_API_KEY = 'test-key';
  process.env.BRAZE_SDK_ENDPOINT = 'sdk.example.com';
  delete process.env.IN_TEST;
};

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
    mockHost.syncUser.mockResolvedValue(undefined);
    mockHost.getBanner.mockResolvedValue(null);
    mockHost.logBannerInteraction.mockResolvedValue(undefined);
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
    expect(mockHost.syncUser).toHaveBeenCalledWith(null);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('forwards a profile ID to the host', async () => {
    initBraze();
    const sendResponse = jest.fn();

    const handled = listener(
      { ...message, profileId: 'canonical-123' },
      { id: extensionId, url: serviceWorkerUrl },
      sendResponse,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handled).toBe(true);
    expect(mockHost.syncUser).toHaveBeenCalledWith('canonical-123');
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('reports a host failure to the background', async () => {
    const error = new Error('SDK unavailable');
    mockHost.syncUser.mockRejectedValueOnce(error);
    initBraze();
    const sendResponse = jest.fn();

    const handled = listener(
      { ...message, profileId: 'canonical-123' },
      { id: extensionId, url: serviceWorkerUrl },
      sendResponse,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handled).toBe(true);
    expect(captureException).toHaveBeenCalledWith(error);
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'SDK unavailable',
    });
  });

  it('clears for an empty profile ID', async () => {
    initBraze();

    listener(
      { ...message, profileId: '' },
      { id: extensionId, url: serviceWorkerUrl },
      jest.fn(),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockHost.syncUser).toHaveBeenCalledWith(null);
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
    expect(mockHost.syncUser).not.toHaveBeenCalled();
  });

  describe('banners', () => {
    const sender = { id: extensionId, url: serviceWorkerUrl };
    const banner = {
      id: 'banner-1',
      placementId: 'extension-wallet-home',
      isControl: false,
      title: null,
      body: 'Explore your wallet',
      imageUrl: null,
      ctaLabel: null,
      deeplink: null,
    };

    it('responds with the banner for a placement', async () => {
      mockHost.getBanner.mockResolvedValueOnce(banner);
      initBraze();
      const sendResponse = jest.fn();

      const handled = listener(
        {
          target: OffscreenCommunicationTarget.brazeOffscreen,
          action: BrazeAction.getBanner,
          placementId: 'extension-wallet-home',
        },
        sender,
        sendResponse,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handled).toBe(true);
      expect(mockHost.getBanner).toHaveBeenCalledWith('extension-wallet-home');
      expect(sendResponse).toHaveBeenCalledWith({ success: true, banner });
    });

    it('responds with null when there is no banner', async () => {
      initBraze();
      const sendResponse = jest.fn();

      listener(
        {
          target: OffscreenCommunicationTarget.brazeOffscreen,
          action: BrazeAction.getBanner,
          placementId: 'extension-wallet-home',
        },
        sender,
        sendResponse,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        banner: null,
      });
    });

    it('forwards a banner interaction', async () => {
      initBraze();
      const sendResponse = jest.fn();

      const handled = listener(
        {
          target: OffscreenCommunicationTarget.brazeOffscreen,
          action: BrazeAction.logBannerInteraction,
          placementId: 'extension-wallet-home',
          bannerId: 'banner-1',
          interaction: 'click',
        },
        sender,
        sendResponse,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handled).toBe(true);
      expect(mockHost.logBannerInteraction).toHaveBeenCalledWith(
        'extension-wallet-home',
        'banner-1',
        'click',
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it.each([
      { action: BrazeAction.getBanner },
      { action: BrazeAction.getBanner, placementId: 1 },
      {
        action: BrazeAction.logBannerInteraction,
        placementId: 'extension-wallet-home',
        interaction: 'click',
      },
      {
        action: BrazeAction.logBannerInteraction,
        placementId: 'extension-wallet-home',
        bannerId: 'banner-1',
        interaction: 'render',
      },
      { action: 'braze-unknown' },
    ])('ignores the malformed message %o', (fields) => {
      initBraze();
      const sendResponse = jest.fn();

      expect(
        listener(
          { target: OffscreenCommunicationTarget.brazeOffscreen, ...fields },
          sender,
          sendResponse,
        ),
      ).toBe(false);
      expect(mockHost.getBanner).not.toHaveBeenCalled();
      expect(mockHost.logBannerInteraction).not.toHaveBeenCalled();
      expect(sendResponse).not.toHaveBeenCalled();
    });
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
