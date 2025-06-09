import { DeepLinkRouter } from './deep-link-router';
import MetaMaskController from '../../../../app/scripts/metamask-controller';
import browser from 'webextension-polyfill';
import { DEEP_LINK_HOST } from '../../../../shared/lib/deep-links/constants';
import { ParsedDeepLink, parse } from '../../../../shared/lib/deep-links/parse';
import log from 'loglevel';

const parseMock = parse as jest.MockedFunction<typeof parse>;

// Mock dependencies

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: jest.fn(() => 'chrome-extension://extension-id/home.html'),
  },
  tabs: {
    update: jest.fn(),
    TAB_ID_NONE: -1,
  },
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      emit: jest.fn(),
    },
  },
}));

jest.mock('../../../../shared/lib/deep-links/parse', () => ({
  parse: jest.fn(),
}));

function spyOnWebRequestListener() {
  let spy = {
    listener: (() => {}) as Parameters<
      typeof browser.webRequest.onBeforeRequest.addListener
    >[0],
  };
  (
    browser.webRequest.onBeforeRequest.addListener as jest.Mock
  ).mockImplementation((callback) => {
    spy.listener = callback;
  });
  return spy;
}

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
  if (route) url += `#${route}`;
  if (queryString) url += `?${queryString}`;
  return url;
});

describe('DeepLinkRouter', () => {
  let router: DeepLinkRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    router = new DeepLinkRouter({
      getExtensionURL: mockGetExtensionURL,
      getState: getState,
    });
  });

  describe('install', () => {
    // @ts-expect-error mocha types are wrong
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
  describe('tryNavigateTo', () => {
    // @ts-expect-error mocha types are wrong
    it.each([2, 3])(
      'should parse the URL and redirect to the correct route',
      async (manifestVersion: number) => {
        mockIsManifestV3.mockReturnValue(manifestVersion === 3);
        const url = `https://example.com/test-route`;

        const mockParsed: ParsedDeepLink = {
          normalizedUrl: new URL(url),
          destination: {
            path: 'link',
            query: new URLSearchParams([['u', '/test-route']]),
          },
          signed: false,
        };
        parseMock.mockResolvedValue(mockParsed);
        const tabId = 1;

        const spy = spyOnWebRequestListener();
        router.install();
        const response = await spy.listener({
          tabId,
          url,
        } as browser.WebRequest.OnBeforeRequestDetailsType);

        expect(parseMock).toHaveBeenCalledWith(url);
        expect(mockGetExtensionURL).toHaveBeenCalledWith(
          mockParsed.destination.path,
          mockParsed.destination.query.toString(),
        );
        expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
          url: 'chrome-extension://extension-id/home.html#link?u=%2Ftest-route',
        });
        expect(response).toEqual(manifestVersion === 3 ? {} : { cancel: true });
      },
    );

    it('should handle redirect signed links to the correct route', async () => {
      const url = `https://example.com/test-route?sig=12345`;
      const tabId = 1;

      const normalizedUrl = new URL(url);
      parseMock.mockResolvedValue({
        normalizedUrl,
        destination: {
          path: 'link',
          query: new URLSearchParams([
            ['u', normalizedUrl.pathname + normalizedUrl.search],
          ]),
        },
        signed: true,
      });

      const spy = spyOnWebRequestListener();
      router.install();
      const response = await spy.listener({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);

      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'chrome-extension://extension-id/home.html#link?u=%2Ftest-route%3Fsig%3D12345',
      });

      expect(response).toEqual({});
    });

    it('should handle redirect signed links to the correct route when skipDeepLinkInterstitial is true', async () => {
      const url = `https://example.com/test-route?sig=12345`;
      const tabId = 1;

      getState.mockReturnValue({
        preferences: { skipDeepLinkInterstitial: true },
      } as ReturnType<MetaMaskController['getState']>);

      const normalizedUrl = new URL(url);
      parseMock.mockResolvedValue({
        normalizedUrl,
        destination: {
          path: 'internal-route',
          query: new URLSearchParams([['one', 'two']]),
        },
        signed: true,
      });

      const spy = spyOnWebRequestListener();
      router.install();
      const response = await spy.listener({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);

      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, {
        url: 'chrome-extension://extension-id/home.html#internal-route?one=two',
      });

      expect(response).toEqual({});
    });

    it('should handle TAB_ID_NONE and not attempt to parse or navigate', async () => {
      const url = `about:blank`;
      const tabId = browser.tabs.TAB_ID_NONE;

      const spy = spyOnWebRequestListener();

      router.install();

      const response = await spy.listener({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);

      expect(parseMock).not.toHaveBeenCalled();
      expect(response).toEqual({});
    });

    it('should handle unparsable URLs and not attempt to navigate', async () => {
      const url = `something unparseable`;
      const tabId = 1;

      parseMock.mockResolvedValue(false);

      const spy = spyOnWebRequestListener();
      router.install();
      const response = await spy.listener({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);

      expect(parseMock).toHaveBeenCalledWith(url);
      expect(response).toEqual({});
    });

    it('should capture browser.tabs.update exceptions and send to Sentry', async () => {
      // Mock log.error
      const logErrorSpy = jest.spyOn(log, 'error');

      const url = `https://example.com/test-route`;
      const tabId = 1;
      const normalizedUrl = new URL(url);
      parseMock.mockResolvedValue({
        normalizedUrl,
        destination: {
          path: 'link',
          query: new URLSearchParams([
            ['u', normalizedUrl.pathname + normalizedUrl.search],
          ]),
        },
        signed: false,
      });
      const error = new Error('Test error');
      (browser.tabs.update as jest.Mock).mockRejectedValue(error);
      const spy = spyOnWebRequestListener();
      router.install();
      await spy.listener({
        tabId,
        url,
      } as browser.WebRequest.OnBeforeRequestDetailsType);
      expect(logErrorSpy).toHaveBeenCalledWith('Error redirecting tab:', error);
    });
  });
});
