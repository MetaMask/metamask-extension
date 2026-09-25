import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import {
  createCashtagResponse,
  isAllowedCashtagSender,
  bindTickerWidgetEnabledBroadcasts,
} from './background';
import type { Controller } from './lib/types';
import { createWidgetFrameAuthorization } from './widget/authorization';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: (path: string) => `chrome-extension://testid/${path}`,
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
  tabs: {
    create: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

const extensionId = 'testid';
const widgetUrl = `chrome-extension://${extensionId}/cashtag-widget.html`;
const authToken = 'a'.repeat(64);
const xTab = { id: 1, url: 'https://x.com/home' } as chrome.tabs.Tab;

function sender(
  overrides: Partial<chrome.runtime.MessageSender>,
): chrome.runtime.MessageSender {
  return {
    id: extensionId,
    ...overrides,
  };
}

describe('isAllowedCashtagSender', () => {
  const authorization = createWidgetFrameAuthorization();
  const message = (type: string, token?: string) => ({
    type,
    body: { authToken: token },
  });
  beforeEach(() => {
    Object.assign(chrome.runtime, {
      id: extensionId,
      getURL: (path: string) => `chrome-extension://${extensionId}/${path}`,
    });
  });

  it('rejects malformed runtime messages', () => {
    expect(
      isAllowedCashtagSender(
        null,
        sender({ frameId: 0, url: 'https://x.com/home' }),
        authorization,
      ),
    ).toBe(false);
  });

  it('allows data requests from the top-frame X content script', () => {
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.GET_DATA),
        sender({ frameId: 0, url: 'https://x.com/home' }),
        authorization,
      ),
    ).toBe(true);
  });

  it('allows enabled-state requests from X subframes', () => {
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED),
        sender({ frameId: 2, url: 'https://x.com/embed' }),
        authorization,
      ),
    ).toBe(true);
  });

  it('rejects enabled-state requests from another website', () => {
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED),
        sender({ frameId: 0, url: 'https://example.com/' }),
        authorization,
      ),
    ).toBe(false);
  });

  it('rejects data requests from another website or an X subframe', () => {
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.GET_DATA),
        sender({ frameId: 0, url: 'https://example.com/' }),
        authorization,
      ),
    ).toBe(false);
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.GET_DATA),
        sender({ frameId: 2, url: 'https://x.com/embed' }),
        authorization,
      ),
    ).toBe(false);
  });

  it('rejects an X-created widget frame without a registered token', () => {
    const unregistered = createWidgetFrameAuthorization();
    const frameSender = sender({ frameId: 1, tab: xTab, url: widgetUrl });

    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.GET_DATA, authToken),
        frameSender,
        unregistered,
      ),
    ).toBe(false);
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.OPEN_EXTENSION, authToken),
        frameSender,
        unregistered,
      ),
    ).toBe(false);
  });

  it('allows widget actions only from the authorized widget frame', () => {
    authorization.register(
      authToken,
      sender({ frameId: 0, tab: xTab, url: xTab.url }),
    );
    authorization.claim(
      authToken,
      sender({ frameId: 1, tab: xTab, url: widgetUrl }),
    );
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.OPEN_EXTENSION, authToken),
        sender({ frameId: 1, tab: xTab, url: widgetUrl }),
        authorization,
      ),
    ).toBe(true);
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED, authToken),
        sender({ frameId: 1, tab: xTab, url: widgetUrl }),
        authorization,
      ),
    ).toBe(true);
  });

  it('rejects widget actions from other extension pages', () => {
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.OPEN_EXTENSION, authToken),
        sender({
          frameId: 1,
          tab: xTab,
          url: `chrome-extension://${extensionId}/home.html`,
        }),
        authorization,
      ),
    ).toBe(false);
  });

  it('rejects the widget frame when its parent tab is not X', () => {
    expect(
      isAllowedCashtagSender(
        message(EXTENSION_MESSAGES.OPEN_EXTENSION, authToken),
        sender({
          frameId: 1,
          tab: {
            id: 2,
            url: 'https://example.com/',
          } as chrome.tabs.Tab,
          url: widgetUrl,
        }),
        authorization,
      ),
    ).toBe(false);
  });
});

describe('createCashtagResponse', () => {
  const caipAssetId = 'eip155:1/slip44:60';
  const swapHash =
    '#/cross-chain/swaps/prepare-bridge-page?to=eip155%3A1%2Fslip44%3A60';
  const authorization = createWidgetFrameAuthorization();
  const widgetSender = sender({
    frameId: 1,
    tab: { ...xTab, windowId: 7 } as chrome.tabs.Tab,
    url: widgetUrl,
  });
  authorization.register(
    authToken,
    sender({ frameId: 0, tab: xTab, url: xTab.url }),
  );
  authorization.claim(authToken, widgetSender);
  const openSwapMessage = {
    type: EXTENSION_MESSAGES.OPEN_EXTENSION,
    body: { page: 'swap', caipAssetId, authToken },
  };

  function getController() {
    return {
      preferencesController: {
        state: {
          preferences: { showTickerWidget: true, useSidePanelAsDefault: true },
        },
      },
      remoteFeatureFlagController: {
        state: { remoteFeatureFlags: { cashtagInjection: true } },
      },
    } as unknown as Controller;
  }

  // A promise that never settles, standing in for a slow API call. Anything
  // awaited before the privileged open would leave the open uncalled.
  function pending() {
    return new Promise<void>(() => undefined);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(chrome.runtime, {
      id: extensionId,
      getURL: (path: string) => `chrome-extension://${extensionId}/${path}`,
      getManifest: () => ({}),
    });
  });

  afterEach(() => {
    delete (globalThis.chrome as { sidePanel?: unknown }).sidePanel;
    delete (globalThis.chrome as { action?: unknown }).action;
  });

  it('opens the side panel without awaiting the path reset first', () => {
    const open = jest.fn().mockResolvedValue(undefined);
    Object.assign(globalThis.chrome, {
      sidePanel: { open, setOptions: jest.fn(pending) },
    });

    createCashtagResponse(
      openSwapMessage,
      widgetSender,
      getController,
      authorization,
    );

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
  });

  it('opens the popup without awaiting setPopup first', () => {
    const openPopup = jest.fn().mockResolvedValue(undefined);
    Object.assign(globalThis.chrome, {
      action: { openPopup, setPopup: jest.fn(pending) },
    });

    createCashtagResponse(
      openSwapMessage,
      widgetSender,
      getController,
      authorization,
    );

    expect(openPopup).toHaveBeenCalledTimes(1);
  });

  it('opens a tab when neither the side panel nor the popup API exists', async () => {
    await createCashtagResponse(
      openSwapMessage,
      widgetSender,
      getController,
      authorization,
    );

    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: `chrome-extension://${extensionId}/home.html${swapHash}`,
    });
  });
});

describe('bindTickerWidgetEnabledBroadcasts', () => {
  it('subscribes to preference and cashtagInjection flag changes', () => {
    const subscribe = jest.fn();
    bindTickerWidgetEnabledBroadcasts(
      () =>
        ({
          controllerMessenger: { subscribe },
        }) as unknown as Controller,
    );

    expect(subscribe.mock.calls.map((call) => call[0])).toEqual([
      'PreferencesController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ]);
  });
});
