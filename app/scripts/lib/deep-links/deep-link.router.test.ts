import browser from 'webextension-polyfill';
import log from 'loglevel';
import MetaMaskController from '../../metamask-controller';
import {
  DEEP_LINK_HOST,
  SIG_PARAM,
} from '../../../../shared/lib/deep-links/constants';
import { ParsedDeepLink, parse } from '../../../../shared/lib/deep-links/parse';
import ExtensionPlatform from '../../platforms/extension';
import { DeepLinkRouter } from './deep-link-router';

// the Jest type for it is wrong
const it = globalThis.it as unknown as jest.It;

let onBeforeRequest:
  | Parameters<typeof browser.webRequest.onBeforeRequest.addListener>[0]
  | null = null;
jest.mock('webextension-polyfill', () => ({
  tabs: {
    update: jest.fn(),
    TAB_ID_NONE: -1,
  },
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn().mockImplementation((callback) => {
        onBeforeRequest = callback;
      }),
      removeListener: jest.fn(),
    },
  },
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://extension-id/${path}`),
  },
}));

const parseMock = parse as jest.MockedFunction<typeof parse>;
jest.mock('../../../../shared/lib/deep-links/parse', () => ({
  parse: jest.fn(),
}));

const mockIsManifestV3 = jest.fn().mockReturnValue(true);
jest.mock('../../../../shared/modules/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3();
  },
}));

const getState = jest.fn(() => ({
  preferences: { skipDeepLinkInterstitial: false },
})) as unknown as jest.MockedFunction<MetaMaskController['getState']>;

describe('DeepLinkRouter', () => {
  let router: DeepLinkRouter;

  beforeEach(() => {
    router = new DeepLinkRouter({
      getExtensionURL: new ExtensionPlatform().getExtensionURL,
      getState,
    });
  });
  afterEach(() => {
    router.uninstall();
    onBeforeRequest = null;
    jest.clearAllMocks();
    (
      browser.tabs.update as jest.MockedFunction<typeof browser.tabs.update>
    ).mockReset();
  });

  describe('installs', () => {
    it.each(['mv2', 'mv3'])(
      `should add a listener for webRequest.onBeforeRequest`,
      (manifestVersion) => {
        mockIsManifestV3.mockReturnValue(manifestVersion === 'mv3');
        router.install();
        expect(
          browser.webRequest.onBeforeRequest.addListener,
        ).toHaveBeenCalledWith(
          expect.any(Function),
          { urls: [`*://*.${DEEP_LINK_HOST}/*`], types: ['main_frame'] },
          mockIsManifestV3() ? [] : ['blocking'],
        );
      },
    );
  });

  describe('uninstalls', () => {
    it('should remove the listener for webRequest.onBeforeRequest', () => {
      router.uninstall();
      expect(
        browser.webRequest.onBeforeRequest.removeListener,
      ).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('handles requests', () => {
    beforeEach(() => {
      router.install();
    });

    // test return values for MV2 and MV3 behavior
    it.each(['mv2', 'mv3'])(
      'should return blocking or non-blocking response based on manifest version',
      async (manifestVersion) => {
        mockIsManifestV3.mockReturnValue(manifestVersion === 'mv3');
        const tabId = 1;
        const url = `https://example.com/external-route`;
        parseMock.mockResolvedValue({
          destination: {},
        } as ParsedDeepLink);
        const response = await onBeforeRequest?.({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);
        expect(browser.tabs.update).toHaveBeenCalledTimes(1);
        // Manifest v2 should return a blocking response (cancel the request),
        expect(response).toEqual(mockIsManifestV3() ? {} : { cancel: true });
      },
    );

    // by default, the router should not skip the interstitial page for either signed or unsigned links
    it.each([{ signed: true }, { signed: false }])(
      'should redirect signed/unsigned links to the correct route',
      async ({ signed }: { signed: boolean }) => {
        const tabId = 1;
        const url = `https://example.com/external-route?query=param`;
        parseMock.mockResolvedValue({
          signature: signed ? 'valid' : 'invalid',
          destination: {},
        } as ParsedDeepLink);
        await onBeforeRequest?.({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);
        expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
          url: 'chrome-extension://extension-id/home.html#link?u=%2Fexternal-route%3Fquery%3Dparam',
        });
      },
    );

    describe('skipDeepLinkInterstitial: true', () => {
      it('should redirect signed links to the correct route when skipDeepLinkInterstitial is true', async () => {
        const tabId = 1;
        const url = `https://example.com/test-route?${SIG_PARAM}=12345`;
        getState.mockReturnValue({
          preferences: { skipDeepLinkInterstitial: true },
        } as unknown as ReturnType<MetaMaskController['getState']>);
        parseMock.mockResolvedValue({
          destination: {
            path: 'internal-route',
            query: new URLSearchParams([['one', 'two']]),
          },
          signature: 'valid',
        } as ParsedDeepLink);
        await onBeforeRequest?.({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);
        // it should go directly to the internal route
        expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
          url: 'chrome-extension://extension-id/home.html#internal-route?one=two',
        });
      });

      it('should redirect unsigned links to the correct route when skipDeepLinkInterstitial is true', async () => {
        const tabId = 1;
        const url = `https://example.com/external-route?query=param`;
        getState.mockReturnValue({
          preferences: { skipDeepLinkInterstitial: true },
        } as unknown as ReturnType<MetaMaskController['getState']>);
        parseMock.mockResolvedValue({
          signature: 'invalid',
          destination: {},
        } as ParsedDeepLink);
        await onBeforeRequest?.({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);
        // it should NOT go directly to the internal route, but still be shown the interstitial
        expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
          url: 'chrome-extension://extension-id/home.html#link?u=%2Fexternal-route%3Fquery%3Dparam',
        });
      });
    });

    it('should handle TAB_ID_NONE and not attempt to parse or navigate', async () => {
      const url = `about:blank`;
      const tabId = browser.tabs.TAB_ID_NONE;
      const response = await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(parseMock).not.toHaveBeenCalled();
      expect(response).toEqual({});
    });

    it('should reject parsing very long URLs', async () => {
      const url = `https://example.com/${'a'.repeat(5000)}`;
      const response = await onBeforeRequest?.({
        tabId: 1,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(parseMock).not.toHaveBeenCalled();
      expect(response).toEqual({});
      expect(browser.tabs.update).not.toHaveBeenCalled();
    });

    it('should handle unparsable URLs and redirect to error page', async () => {
      const url = `something unparseable`;
      const tabId = 1;
      parseMock.mockResolvedValue(false);
      const mockError = jest.fn();
      router.on('error', mockError);
      const response = await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(parseMock).not.toHaveBeenCalled();
      expect(response).toEqual({});
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'chrome-extension://extension-id/home.html#link?errorCode=404',
      });
      expect(mockError).toHaveBeenCalledTimes(1);
      expect(mockError.mock.calls[0][0].message).toBe('Invalid URL');
    });

    it('should capture browser.tabs.update exceptions and emit an error event', async function () {
      const logErrorSpy = jest.spyOn(log, 'error');
      const tabId = 1;
      const url = `https://example.com/test-route`;
      parseMock.mockResolvedValue({
        destination: {},
        signature: 'invalid',
      } as ParsedDeepLink);

      const mockErrorCallback = jest.fn();
      router.on('error', mockErrorCallback);

      const error = new Error('Test error');
      (browser.tabs.update as jest.Mock).mockRejectedValue(error);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(logErrorSpy).toHaveBeenCalledWith('Error redirecting tab:', error);
      expect(mockErrorCallback).toHaveBeenCalledTimes(1);
      expect(mockErrorCallback).toHaveBeenCalledWith(error);
    });

    it('should handle redirecting routes', async function () {
      const tabId = 1;
      const url = `https://example.com/redirect-route`;
      parseMock.mockResolvedValue({
        destination: {
          redirectTo: new URL('https://example.com/internal-route'),
        },
      } as ParsedDeepLink);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'https://example.com/internal-route',
      });
    });

    it("should handle routes that don't exist by redirecting to 404", async function () {
      const tabId = 1;
      const url = `https://example.com/nonexistent-route`;
      parseMock.mockResolvedValue(false);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'chrome-extension://extension-id/home.html#link?errorCode=404',
      });
    });
  });
});
