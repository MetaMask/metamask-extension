import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import {
  createCashtagResponse,
  isAllowedCashtagSender,
  bindTickerWidgetEnabledBroadcasts,
} from './background';
import type { Controller } from './lib/types';

const extensionId = 'testid';
const widgetUrl = `chrome-extension://${extensionId}/cashtag-widget.html?symbol=ETH`;
const xTab = { id: 1, url: 'https://x.com/home' } as chrome.tabs.Tab;
const mockRuntimeMessageListeners: ((
  message: unknown,
  sender: chrome.runtime.MessageSender,
) => unknown)[] = [];

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: (path: string) => `chrome-extension://testid/${path}`,
    sendMessage: jest.fn(async (message: unknown) => {
      const extensionPageSender = {
        id: 'testid',
        url: 'chrome-extension://testid/sidepanel.html',
      } as chrome.runtime.MessageSender;
      for (const listener of [...mockRuntimeMessageListeners].reverse()) {
        const response = await listener(message, extensionPageSender);
        if (response !== undefined && response !== false) {
          return response;
        }
      }
      return undefined;
    }),
    onMessage: {
      addListener: jest.fn((listener) =>
        mockRuntimeMessageListeners.push(listener),
      ),
    },
  },
  tabs: {
    create: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

function sender(
  overrides: Partial<chrome.runtime.MessageSender>,
): chrome.runtime.MessageSender {
  return {
    id: extensionId,
    ...overrides,
  };
}

function consumeRoute(windowId: number) {
  return browser.runtime.sendMessage({
    type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
    body: { windowId },
  });
}

function getController(useExternalServices = true) {
  return {
    preferencesController: {
      state: {
        useExternalServices,
        preferences: { showTickerWidget: true, useSidePanelAsDefault: true },
      },
    },
    remoteFeatureFlagController: {
      state: { remoteFeatureFlags: { cashtagInjection: true } },
    },
    bridgeController: {
      setLocation: jest.fn(),
    },
  } satisfies Controller;
}

describe('isAllowedCashtagSender', () => {
  beforeEach(() => {
    Object.assign(chrome.runtime, {
      id: extensionId,
      getURL: (path: string) => `chrome-extension://${extensionId}/${path}`,
    });
  });

  it('allows data requests from the top-frame X content script', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_DATA,
        sender({ frameId: 0, url: 'https://x.com/home' }),
      ),
    ).toBe(true);
  });

  it('allows enabled-state requests from X subframes', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
        sender({ frameId: 2, url: 'https://x.com/embed' }),
      ),
    ).toBe(true);
  });

  it('rejects enabled-state requests from another website', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
        sender({ frameId: 0, url: 'https://example.com/' }),
      ),
    ).toBe(false);
  });

  it('rejects data requests from another website or an X subframe', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_DATA,
        sender({ frameId: 0, url: 'https://example.com/' }),
      ),
    ).toBe(false);
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_DATA,
        sender({ frameId: 2, url: 'https://x.com/embed' }),
      ),
    ).toBe(false);
  });

  it('allows widget actions only from the widget frame', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.OPEN_EXTENSION,
        sender({ frameId: 1, tab: xTab, url: widgetUrl }),
      ),
    ).toBe(true);
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
        sender({ frameId: 1, tab: xTab, url: widgetUrl }),
      ),
    ).toBe(true);
  });

  it('rejects widget actions from other extension pages', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.OPEN_EXTENSION,
        sender({
          frameId: 1,
          tab: xTab,
          url: `chrome-extension://${extensionId}/home.html`,
        }),
      ),
    ).toBe(false);
  });

  it('rejects the widget frame when its parent tab is not X', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.OPEN_EXTENSION,
        sender({
          frameId: 1,
          tab: {
            id: 2,
            url: 'https://example.com/',
          } as chrome.tabs.Tab,
          url: widgetUrl,
        }),
      ),
    ).toBe(false);
  });
});

describe('createCashtagResponse', () => {
  const caipAssetId = 'eip155:1/slip44:60';
  const widgetSender = sender({
    frameId: 1,
    tab: { ...xTab, windowId: 7 } as chrome.tabs.Tab,
    url: widgetUrl,
  });
  const openSwapMessage = {
    type: EXTENSION_MESSAGES.OPEN_EXTENSION,
    body: { page: 'swap', caipAssetId },
  };

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

  it('hands the requested route to the shared side-panel handler', async () => {
    const open = jest.fn().mockResolvedValue(undefined);
    Object.assign(globalThis.chrome, { sidePanel: { open } });

    await createCashtagResponse(openSwapMessage, widgetSender, getController);

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_ROUTE,
      body: { windowId: 7 },
    });
    await expect(consumeRoute(7)).resolves.toMatchObject({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: {
        path: '/cross-chain/swaps/prepare-bridge-page',
        search: '?to=eip155%3A1%2Fslip44%3A60',
      },
    });
  });

  it('does not enable the widget when Basic Functionality is disabled', async () => {
    const response = await createCashtagResponse(
      { type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED },
      sender({ frameId: 0, url: 'https://x.com/home' }),
      () => getController(false),
    );

    expect(response).toEqual({
      type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
      body: { enabled: false },
    });
  });

  it('does not fetch widget data when Basic Functionality is disabled', async () => {
    const response = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.GET_DATA,
        body: { symbol: 'ETH', fields: ['priceHistory'] },
      },
      sender({ frameId: 0, url: 'https://x.com/home' }),
      () => getController(false),
    );

    expect(response).toEqual({
      type: EXTENSION_MESSAGES.GET_DATA,
      body: { asset: null, similar: [], priceHistory: null },
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
