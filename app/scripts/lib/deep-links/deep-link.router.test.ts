import browser from 'webextension-polyfill';
import log from 'loglevel';
import MetaMaskController from '../../metamask-controller';
import { DEEP_LINK_HOST } from '../../../../shared/lib/deep-links/constants';
import { ParsedDeepLink, parse } from '../../../../shared/lib/deep-links/parse';
import { DeepLinkRouter } from './deep-link-router';

const parseMock = parse as jest.MockedFunction<typeof parse>;
type WebRequestListener = Parameters<
  typeof browser.webRequest.onBeforeRequest.addListener
>[0];
let onBeforeRequest: WebRequestListener | null = null;
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
}));
jest.mock('../../../../shared/lib/deep-links/parse', () => ({
  parse: jest.fn(),
}));
global.sentry = { captureException: jest.fn() };
const mockIsManifestV3 = jest.fn().mockReturnValue(true);
jest.mock('../../../../shared/modules/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3();
  },
}));
const getState = jest.fn(() => ({
  preferences: { skipDeepLinkInterstitial: false },
})) as unknown as jest.MockedFunction<MetaMaskController['getState']>;
const mockGetExtensionURL = jest.fn((route, queryString) => {
  let url = 'chrome-extension://extension-id/home.html';
  if (route) {
    url += `#${route}`;
  }
  if (queryString) {
    url += `?${queryString}`;
  }
  return url;
});
describe('DeepLinkRouter', () => {
  let router: DeepLinkRouter;
  beforeEach(() => {
    onBeforeRequest = null;
    jest.clearAllMocks();
    jest.restoreAllMocks();
    router = new DeepLinkRouter({
      getExtensionURL: mockGetExtensionURL,
      getState,
    });
  });
  describe('install', () => {
    // test the two manifest versions
    // @ts-expect-error jest types aren't applied correctly
    it.each([2, 3])(
      `should add a listener for webRequest.onBeforeRequest`,
      (manifestVersion: number) => {
        mockIsManifestV3.mockReturnValue(manifestVersion === 3);
        router.install();
        expect(
          browser.webRequest.onBeforeRequest.addListener,
        ).toHaveBeenCalledWith(
          expect.any(Function),
          { urls: [`*://*.${DEEP_LINK_HOST}/*`], types: ['main_frame'] },
          manifestVersion === 2 ? ['blocking'] : [],
        );
      },
    );
  });
  describe('uninstall', () => {
    it('should remove the listener for webRequest.onBeforeRequest', () => {
      router.uninstall();
      expect(
        browser.webRequest.onBeforeRequest.removeListener,
      ).toHaveBeenCalledWith(expect.any(Function));
    });
  });
  describe('handle requests', () => {
    beforeEach(() => {
      router.install();
    });
    // test return values for MV2 and MV3 behavior
    // @ts-expect-error jest types aren't applied correctly
    it.each([{ manifestVersion: 2 }, { manifestVersion: 3 }])(
      'should return blocking or non-blocking response based on manifest version',
      async ({ manifestVersion }: { manifestVersion: number }) => {
        mockIsManifestV3.mockReturnValue(manifestVersion === 3);
        const tabId = 1;
        const url = `https://example.com/external-route`;
        parseMock.mockResolvedValue({
          normalizedUrl: new URL(url),
        } as ParsedDeepLink);
        const response = await onBeforeRequest?.({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);
        expect(browser.tabs.update).toHaveBeenCalledTimes(1);
        // Manifest v2 should return a blocking response (cancel the request),
        expect(response).toEqual(manifestVersion === 3 ? {} : { cancel: true });
      },
    );
    // by default, the router should not skip the interstitial page for either signed or unsigned links
    // @ts-expect-error jest types aren't applied correctly
    it.each([{ signed: true }, { signed: false }])(
      'should redirect signed links to the correct route',
      async ({ signed }: { signed: boolean }) => {
        const tabId = 1;
        const url = `https://example.com/external-route?query=param`;
        parseMock.mockResolvedValue({
          normalizedUrl: new URL(url),
          signed,
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
        const url = `https://example.com/test-route?sig=12345`;
        getState.mockReturnValue({
          preferences: { skipDeepLinkInterstitial: true },
        } as unknown as ReturnType<MetaMaskController['getState']>);
        const normalizedUrl = new URL(url);
        parseMock.mockResolvedValue({
          normalizedUrl,
          destination: {
            path: 'internal-route',
            query: new URLSearchParams([['one', 'two']]),
          },
          signed: true,
        });
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
          normalizedUrl: new URL(url),
          signed: false,
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
    });
    it('should handle unparsable URLs and not attempt to navigate', async () => {
      const url = `something unparseable`;
      const tabId = 1;
      parseMock.mockResolvedValue(false);
      const response = await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(parseMock).toHaveBeenCalledWith(url);
      expect(response).toEqual({});
    });
    it('should capture browser.tabs.update exceptions and send to Sentry', async () => {
      const logErrorSpy = jest.spyOn(log, 'error');
      const tabId = 1;
      const url = `https://example.com/test-route`;
      parseMock.mockResolvedValue({
        normalizedUrl: new URL(url),
        signed: false,
      } as ParsedDeepLink);
      const error = new Error('Test error');
      (browser.tabs.update as jest.Mock).mockRejectedValue(error);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(logErrorSpy).toHaveBeenCalledWith('Error redirecting tab:', error);
    });
  });
});
