import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { openRoute } from '../sidepanel/background';
import {
  createCashtagResponse,
  isAllowedCashtagSender,
  bindTickerWidgetEnabledBroadcasts,
} from './background';
import type { Controller } from './lib/types';

jest.mock('../sidepanel/background', () => ({
  openRoute: jest.fn().mockResolvedValue(undefined),
}));

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
const widgetUrl = `chrome-extension://${extensionId}/cashtag-widget.html?symbol=ETH`;
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

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(chrome.runtime, {
      id: extensionId,
      getURL: (path: string) => `chrome-extension://${extensionId}/${path}`,
      getManifest: () => ({}),
    });
  });

  it('does not enable the widget when Basic Functionality is disabled', async () => {
    const controller = getController(false);

    const response = await createCashtagResponse(
      { type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED },
      sender({ frameId: 0, url: 'https://x.com/home' }),
      () => controller,
    );

    expect(response).toEqual({
      type: EXTENSION_MESSAGES.GET_X_WIDGET_ENABLED,
      body: { enabled: false },
    });
  });

  it('does not fetch widget data when Basic Functionality is disabled', async () => {
    const controller = getController(false);

    const response = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.GET_DATA,
        body: { symbol: 'ETH', fields: ['priceHistory'] },
      },
      sender({ frameId: 0, url: 'https://x.com/home' }),
      () => controller,
    );

    expect(response).toEqual({
      type: EXTENSION_MESSAGES.GET_DATA,
      body: { asset: null, similar: [], priceHistory: null },
    });
  });

  it('sets bridge location to x_widget and opens the swap route', async () => {
    const controller = getController();
    await createCashtagResponse(
      openSwapMessage,
      widgetSender,
      () => controller,
    );

    expect(controller.bridgeController?.setLocation).toHaveBeenCalledWith(
      'x_widget',
    );
    expect(openRoute).toHaveBeenCalledWith({
      controller,
      windowId: 7,
      path: '/cross-chain/swaps/prepare-bridge-page',
      search: '?to=eip155%3A1%2Fslip44%3A60',
    });
  });

  it('handles hover interaction type in track event message', async () => {
    const response = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.TRACK_EVENT,
        body: {
          interactionType: 'hover',
          tokenSymbol: 'ETH',
          caipAssetId,
          chainId: 'eip155:1',
          verified: true,
          similarTokenCount: 0,
        },
      },
      widgetSender,
      getController,
    );

    expect(response).toBeUndefined();
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
