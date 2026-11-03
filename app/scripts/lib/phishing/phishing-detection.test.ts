import browser from 'webextension-polyfill';
import { PhishingDetectorResultType } from '@metamask/phishing-controller';
import { maybeDetectPhishing } from './phishing-detection';
import { phishingPageHref } from './phishing-warning-page';
import type { PhishingDetectionController } from './types';

process.env.PHISHING_WARNING_PAGE_URL =
  'https://metamask.github.io/phishing-warning/v4.1.0/';

jest.mock('webextension-polyfill', () => ({
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    TAB_ID_NONE: -1,
    get: jest.fn(),
    update: jest.fn(),
  },
}));

const WARNING_PAGE_ORIGIN = 'https://metamask.github.io';
const WARNING_PAGE_PATH = '/phishing-warning/v4.1.0/';

function createMockController(
  overrides: Partial<{
    completedOnboarding: boolean;
    usePhishDetect: boolean;
    testResult: boolean;
    blockedRequestResult: boolean;
  }> = {},
): PhishingDetectionController {
  return {
    onboardingController: {
      state: {
        completedOnboarding: overrides.completedOnboarding ?? true,
      },
    },
    preferencesController: {
      state: {
        usePhishDetect: overrides.usePhishDetect ?? true,
      },
    },
    phishingController: {
      maybeUpdateState: jest.fn(),
      test: jest.fn().mockReturnValue({
        result: overrides.testResult ?? false,
        type: PhishingDetectorResultType.Blocklist,
      }),
      isBlockedRequest: jest.fn().mockReturnValue({
        result: overrides.blockedRequestResult ?? false,
        type: PhishingDetectorResultType.C2DomainBlocklist,
      }),
    },
  };
}

function getRegisteredListener(): (
  details: browser.WebRequest.OnBeforeRequestDetailsType,
) => browser.WebRequest.BlockingResponse | Record<string, never> {
  const addListenerMock = browser.webRequest.onBeforeRequest
    .addListener as jest.Mock;
  return addListenerMock.mock.calls[0][0];
}

describe('maybeDetectPhishing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.PHISHING_WARNING_PAGE_URL = `${WARNING_PAGE_ORIGIN}${WARNING_PAGE_PATH}`;
  });

  it('registers a webRequest listener for http(s) and ws(s) URLs', () => {
    maybeDetectPhishing(createMockController(), {
      browserApi: browser,
      isManifestV3Flag: true,
    });

    expect(browser.webRequest.onBeforeRequest.addListener).toHaveBeenCalledWith(
      expect.any(Function),
      {
        urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'],
      },
      [],
    );
  });

  it('registers blocking mode on MV2', () => {
    maybeDetectPhishing(createMockController(), {
      browserApi: browser,
      isManifestV3Flag: false,
    });

    expect(browser.webRequest.onBeforeRequest.addListener).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Object),
      ['blocking'],
    );
  });

  it('returns early when tab id is none', () => {
    maybeDetectPhishing(createMockController(), {
      browserApi: browser,
      isManifestV3Flag: true,
    });

    const listener = getRegisteredListener();
    expect(
      listener({
        tabId: browser.tabs.TAB_ID_NONE,
        url: 'https://example.com',
        type: 'main_frame',
      } as browser.WebRequest.OnBeforeRequestDetailsType),
    ).toStrictEqual({});
  });

  it('returns early when onboarding is incomplete', () => {
    maybeDetectPhishing(createMockController({ completedOnboarding: false }), {
      browserApi: browser,
      isManifestV3Flag: true,
    });

    const listener = getRegisteredListener();
    expect(
      listener({
        tabId: 1,
        url: 'https://example.com',
        type: 'main_frame',
      } as browser.WebRequest.OnBeforeRequestDetailsType),
    ).toStrictEqual({});
  });

  it('returns early when phishing detection is disabled', () => {
    maybeDetectPhishing(createMockController({ usePhishDetect: false }), {
      browserApi: browser,
      isManifestV3Flag: true,
    });

    const listener = getRegisteredListener();
    expect(
      listener({
        tabId: 1,
        url: 'https://example.com',
        type: 'main_frame',
      } as browser.WebRequest.OnBeforeRequestDetailsType),
    ).toStrictEqual({});
  });

  it('returns early for requests initiated from the phishing warning page', () => {
    maybeDetectPhishing(createMockController(), {
      browserApi: browser,
      isManifestV3Flag: true,
    });

    const listener = getRegisteredListener();
    expect(
      listener({
        tabId: 1,
        url: 'https://example.com',
        type: 'main_frame',
        initiator: `${WARNING_PAGE_ORIGIN}${WARNING_PAGE_PATH}`,
      } as browser.WebRequest.OnBeforeRequestDetailsType),
    ).toStrictEqual({});
  });

  it('returns early for test bypass query param when in test mode', () => {
    maybeDetectPhishing(createMockController(), {
      browserApi: browser,
      isManifestV3Flag: true,
      inTest: true,
    });

    const listener = getRegisteredListener();
    expect(
      listener({
        tabId: 1,
        url: 'https://example.com?IN_TEST_BYPASS_EARLY_PHISHING_DETECTION=1',
        type: 'main_frame',
      } as browser.WebRequest.OnBeforeRequestDetailsType),
    ).toStrictEqual({});
  });

  it('redirects main_frame requests on MV2 when the URL is blocked', () => {
    const trackPhishingPageDisplayed = jest.fn();
    const controller = createMockController({ testResult: true });

    maybeDetectPhishing(controller, {
      browserApi: browser,
      isManifestV3Flag: false,
      isFirefox: false,
      trackPhishingPageDisplayed,
    });

    const listener = getRegisteredListener();
    const response = listener({
      tabId: 1,
      url: 'https://phishing.test',
      type: 'main_frame',
    } as browser.WebRequest.OnBeforeRequestDetailsType);

    expect(controller.phishingController.maybeUpdateState).toHaveBeenCalled();
    expect(response).toStrictEqual({
      redirectUrl: expect.stringContaining(phishingPageHref),
    });
    expect(trackPhishingPageDisplayed).toHaveBeenCalledWith({
      url: 'https://phishing.test/',
      reason: PhishingDetectorResultType.Blocklist,
      requestDomain: undefined,
    });
  });

  it('redirects tabs asynchronously on MV3 when the URL is blocked', async () => {
    (browser.tabs.get as jest.Mock).mockResolvedValueOnce({
      url: 'https://example.com',
    });
    (browser.tabs.update as jest.Mock).mockResolvedValueOnce(undefined);

    const trackPhishingPageDisplayed = jest.fn();
    const controller = createMockController({ testResult: true });

    maybeDetectPhishing(controller, {
      browserApi: browser,
      isManifestV3Flag: true,
      isFirefox: false,
      trackPhishingPageDisplayed,
    });

    const listener = getRegisteredListener();
    const response = listener({
      tabId: 42,
      url: 'https://phishing.test',
      type: 'main_frame',
    } as browser.WebRequest.OnBeforeRequestDetailsType);

    expect(response).toStrictEqual({});
    await Promise.resolve();
    await Promise.resolve();
    expect(browser.tabs.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        url: expect.stringContaining(phishingPageHref),
      }),
    );
  });
});
