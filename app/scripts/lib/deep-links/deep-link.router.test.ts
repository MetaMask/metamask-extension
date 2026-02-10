import browser from 'webextension-polyfill';
import log from 'loglevel';
import MetaMaskController from '../../metamask-controller';
import {
  DEEP_LINK_BASIC_FUNCTIONALITY_OFF,
  DEEP_LINK_HOST,
  SIG_PARAM,
} from '../../../../shared/lib/deep-links/constants';
import {
  DEFAULT_ROUTE,
  SWAP_ROUTE,
} from '../../../../shared/lib/deep-links/routes/route';
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
  useExternalServices: true,
})) as unknown as jest.MockedFunction<MetaMaskController['getState']>;

const TEST_DEEPLINK_ORIGIN = 'https://example.com';
const EXTERNAL_ROUTE_PATH = 'external-route';
const INTERNAL_ROUTE_PATH = 'internal-route';
const REDIRECT_ROUTE_PATH = 'redirect-route';
const NONEXISTENT_ROUTE_PATH = 'nonexistent-route';
const SWAP_ROUTE_PATH = 'swap';

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
        const url = `${TEST_DEEPLINK_ORIGIN}/${EXTERNAL_ROUTE_PATH}`;
        parseMock.mockResolvedValue({
          destination: {
            path: EXTERNAL_ROUTE_PATH,
            query: new URLSearchParams(),
          },
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
        const url = `${TEST_DEEPLINK_ORIGIN}/${EXTERNAL_ROUTE_PATH}?query=param`;
        parseMock.mockResolvedValue({
          signature: signed ? 'valid' : 'invalid',
          destination: {
            path: EXTERNAL_ROUTE_PATH,
            query: new URLSearchParams(),
          },
        } as ParsedDeepLink);
        await onBeforeRequest?.({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);
        expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
          url: `chrome-extension://extension-id/home.html#link?u=%2F${EXTERNAL_ROUTE_PATH}%3Fquery%3Dparam`,
        });
      },
    );

    describe('skipDeepLinkInterstitial: true', () => {
      it('should redirect signed links to the correct route when skipDeepLinkInterstitial is true', async () => {
        const tabId = 1;
        const url = `${TEST_DEEPLINK_ORIGIN}/${INTERNAL_ROUTE_PATH}?${SIG_PARAM}=12345`;
        getState.mockReturnValue({
          preferences: { skipDeepLinkInterstitial: true },
          useExternalServices: true,
        } as unknown as ReturnType<MetaMaskController['getState']>);
        parseMock.mockResolvedValue({
          destination: {
            path: INTERNAL_ROUTE_PATH,
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
          url: `chrome-extension://extension-id/home.html#${INTERNAL_ROUTE_PATH}?one=two`,
        });
      });

      it('should redirect unsigned links to the correct route when skipDeepLinkInterstitial is true', async () => {
        const tabId = 1;
        const url = `${TEST_DEEPLINK_ORIGIN}/${EXTERNAL_ROUTE_PATH}?query=param`;
        getState.mockReturnValue({
          preferences: { skipDeepLinkInterstitial: true },
          useExternalServices: true,
        } as unknown as ReturnType<MetaMaskController['getState']>);
        parseMock.mockResolvedValue({
          signature: 'invalid',
          destination: {
            path: EXTERNAL_ROUTE_PATH,
            query: new URLSearchParams(),
          },
        } as ParsedDeepLink);
        await onBeforeRequest?.({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);
        // it should NOT go directly to the internal route, but still be shown the interstitial
        expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
          url: `chrome-extension://extension-id/home.html#link?u=%2F${EXTERNAL_ROUTE_PATH}%3Fquery%3Dparam`,
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
      const url = `${TEST_DEEPLINK_ORIGIN}/${'a'.repeat(5000)}`;
      const response = await onBeforeRequest?.({
        tabId: 1,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(parseMock).not.toHaveBeenCalled();
      expect(response).toEqual({});
      expect(browser.tabs.update).not.toHaveBeenCalled();
    });

    it('should handle unparsable URLs and redirect to error page without u param', async () => {
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
      const url = `${TEST_DEEPLINK_ORIGIN}/${INTERNAL_ROUTE_PATH}`;
      parseMock.mockResolvedValue({
        destination: {
          path: INTERNAL_ROUTE_PATH,
          query: new URLSearchParams(),
        },
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
      const url = `${TEST_DEEPLINK_ORIGIN}/${REDIRECT_ROUTE_PATH}`;
      parseMock.mockResolvedValue({
        destination: {
          redirectTo: new URL(`${TEST_DEEPLINK_ORIGIN}/${INTERNAL_ROUTE_PATH}`),
        },
      } as ParsedDeepLink);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: `${TEST_DEEPLINK_ORIGIN}/${INTERNAL_ROUTE_PATH}`,
      });
    });

    it("should handle routes that don't exist by redirecting to 404, including u param", async function () {
      const tabId = 1;
      const url = `${TEST_DEEPLINK_ORIGIN}/${NONEXISTENT_ROUTE_PATH}`;
      parseMock.mockResolvedValue(false);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: `chrome-extension://extension-id/home.html#link?errorCode=404&u=%2F${NONEXISTENT_ROUTE_PATH}`,
      });
    });

    it('redirects to interstitial when Basic Functionality is off and destination is not in the allowlist', async function () {
      const tabId = 1;
      const url = `${TEST_DEEPLINK_ORIGIN}/${SWAP_ROUTE_PATH}?from=eip155%3A1%2Ferc20%3A0xA0b86991&to=eip155%3A1%2Ferc20%3A0xdAC17F958D2ee523a2206206994597C13D831ec7`;
      getState.mockReturnValue({
        preferences: { skipDeepLinkInterstitial: false },
        useExternalServices: false,
      } as unknown as ReturnType<MetaMaskController['getState']>);
      parseMock.mockResolvedValue({
        destination: {
          path: SWAP_ROUTE,
          query: new URLSearchParams(),
        },
        signature: 'valid',
      } as ParsedDeepLink);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'chrome-extension://extension-id/home.html#link?u=%2Fswap%3Ffrom%3Deip155%253A1%252Ferc20%253A0xA0b86991%26to%3Deip155%253A1%252Ferc20%253A0xdAC17F958D2ee523a2206206994597C13D831ec7&basicFunctionalityOff=true',
      });
    });

    it('allows deeplinks when Basic Functionality is on and destination is not in the allowlist', async function () {
      const tabId = 1;
      const url = `${TEST_DEEPLINK_ORIGIN}/${SWAP_ROUTE_PATH}`;
      getState.mockReturnValue({
        preferences: { skipDeepLinkInterstitial: true },
        useExternalServices: true,
      } as unknown as ReturnType<MetaMaskController['getState']>);
      parseMock.mockResolvedValue({
        destination: {
          path: SWAP_ROUTE,
          query: new URLSearchParams([['swaps', 'true']]),
        },
        signature: 'valid',
      } as ParsedDeepLink);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'chrome-extension://extension-id/home.html#/cross-chain/swaps/prepare-bridge-page?swaps=true',
      });
    });

    it('allows deeplinks when Basic Functionality is off and destination is in the allowlist (e.g. home)', async function () {
      const tabId = 1;
      const url = `${TEST_DEEPLINK_ORIGIN}/home`;
      getState.mockReturnValue({
        preferences: { skipDeepLinkInterstitial: true },
        useExternalServices: false,
      } as unknown as ReturnType<MetaMaskController['getState']>);
      parseMock.mockResolvedValue({
        destination: {
          path: DEFAULT_ROUTE,
          query: new URLSearchParams(),
        },
        signature: 'valid',
      } as ParsedDeepLink);
      await onBeforeRequest?.({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'chrome-extension://extension-id/home.html#/',
      });
    });
  });
});
