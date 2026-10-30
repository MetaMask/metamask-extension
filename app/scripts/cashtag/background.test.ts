import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import {
  createCashtagResponse,
  isAllowedCashtagSender,
  bindTickerWidgetEnabledBroadcasts,
} from './background';
import type { Controller } from './lib/types';

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

function sidePanelSender(
  overrides?: Partial<chrome.runtime.MessageSender>,
): chrome.runtime.MessageSender {
  return {
    id: extensionId,
    url: `chrome-extension://${extensionId}/sidepanel.html`,
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

  it('allows CONSUME_PENDING_ROUTE from extension pages (side panel)', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        sidePanelSender(),
      ),
    ).toBe(true);
  });

  it('rejects CONSUME_PENDING_ROUTE from content scripts', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        sender({
          frameId: 0,
          tab: xTab,
          url: 'https://x.com/home',
        }),
      ),
    ).toBe(false);
  });

  it('rejects CONSUME_PENDING_ROUTE when sender has tab field', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        sidePanelSender({ tab: xTab }),
      ),
    ).toBe(false);
  });
});

describe('createCashtagResponse', () => {
  const caipAssetId = 'eip155:1/slip44:60';
  const swapHash =
    '#/cross-chain/swaps/prepare-bridge-page?to=eip155%3A1%2Fslip44%3A60';
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

    [7, 8].forEach((windowId) => {
      createCashtagResponse(
        {
          type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
          body: { windowId },
        },
        sidePanelSender(),
        getController,
      );
    });
  });

  afterEach(() => {
    delete (globalThis.chrome as { sidePanel?: unknown }).sidePanel;
    delete (globalThis.chrome as { action?: unknown }).action;
  });

  it('sets pending route entry before calling open synchronously', async () => {
    let consumeDuringOpen: Promise<unknown> | undefined;

    const open = jest.fn().mockImplementation(() => {
      consumeDuringOpen = createCashtagResponse(
        {
          type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
          body: { windowId: 7 },
        },
        sidePanelSender(),
        getController,
      );

      return Promise.resolve(undefined);
    });
    Object.assign(globalThis.chrome, {
      sidePanel: { open },
    });

    await createCashtagResponse(openSwapMessage, widgetSender, getController);

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_ROUTE,
      body: { windowId: 7 },
    });

    await expect(consumeDuringOpen).resolves.toMatchObject({
      body: {
        path: '/cross-chain/swaps/prepare-bridge-page',
        search: '?to=eip155%3A1%2Fslip44%3A60',
      },
    });
  });

  it('deletes pending route entry when open rejects', async () => {
    const open = jest.fn().mockRejectedValue(new Error('no gesture'));
    Object.assign(globalThis.chrome, {
      sidePanel: { open },
    });

    await createCashtagResponse(openSwapMessage, widgetSender, getController);

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(browser.runtime.sendMessage).not.toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_ROUTE,
      body: { windowId: 7 },
    });

    const consumeResponse = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { windowId: 7 },
      },
      sidePanelSender(),
      getController,
    );

    expect(consumeResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('preserves newer pending route when earlier open rejects', async () => {
    let firstReject: ((error: Error) => void) | undefined;
    let secondResolve: (() => void) | undefined;

    const open = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve, reject) => {
        if (firstReject) {
          secondResolve = resolve;
        } else {
          firstReject = reject;
        }
      });
    });

    Object.assign(globalThis.chrome, {
      sidePanel: { open },
    });

    const firstOpen = createCashtagResponse(
      openSwapMessage,
      widgetSender,
      getController,
    );
    const secondOpen = createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.OPEN_EXTENSION,
        body: { page: 'asset', caipAssetId },
      },
      widgetSender,
      getController,
    );

    await Promise.resolve();

    expect(open).toHaveBeenCalledTimes(2);
    expect(firstReject).toBeDefined();
    expect(secondResolve).toBeDefined();

    if (firstReject) {
      firstReject(new Error('no gesture'));
    }
    if (secondResolve) {
      secondResolve();
    }

    await Promise.allSettled([firstOpen, secondOpen]);

    const consumeResponse = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { windowId: 7 },
      },
      sidePanelSender(),
      getController,
    );

    expect(consumeResponse).toMatchObject({
      body: { path: expect.stringMatching(/^\/asset\//u) },
    });
  });

  it('consumes pending route once and returns null after', async () => {
    const consumeMessage = {
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { windowId: 7 },
    };

    const open = jest.fn().mockResolvedValue(undefined);
    Object.assign(globalThis.chrome, {
      sidePanel: { open },
    });

    await createCashtagResponse(openSwapMessage, widgetSender, getController);

    const firstResponse = await createCashtagResponse(
      consumeMessage,
      sidePanelSender(),
      getController,
    );
    expect(firstResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: {
        path: '/cross-chain/swaps/prepare-bridge-page',
        search: '?to=eip155%3A1%2Fslip44%3A60',
      },
    });

    const secondResponse = await createCashtagResponse(
      consumeMessage,
      sidePanelSender(),
      getController,
    );
    expect(secondResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('isolates pending routes per window', async () => {
    const open = jest.fn().mockResolvedValue(undefined);
    Object.assign(globalThis.chrome, {
      sidePanel: { open },
    });

    const window7Sender = sender({
      frameId: 1,
      tab: { ...xTab, windowId: 7 } as chrome.tabs.Tab,
      url: widgetUrl,
    });
    const window8Sender = sender({
      frameId: 1,
      tab: { ...xTab, windowId: 8 } as chrome.tabs.Tab,
      url: widgetUrl,
    });

    await createCashtagResponse(openSwapMessage, window7Sender, getController);
    await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.OPEN_EXTENSION,
        body: { page: 'asset', caipAssetId },
      },
      window8Sender,
      getController,
    );

    const window7Response = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { windowId: 7 },
      },
      sidePanelSender(),
      getController,
    );
    expect(window7Response).toMatchObject({
      body: { path: '/cross-chain/swaps/prepare-bridge-page' },
    });

    const window8Response = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { windowId: 8 },
      },
      sidePanelSender(),
      getController,
    );
    expect(window8Response).toMatchObject({
      body: { path: expect.stringMatching(/^\/asset\//u) },
    });
  });

  it('returns null when consuming with missing windowId', async () => {
    const consumeResponse = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: {},
      },
      sidePanelSender(),
      getController,
    );

    expect(consumeResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('returns null when consuming with non-number windowId', async () => {
    const consumeResponse = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { windowId: 'not-a-number' },
      },
      sidePanelSender(),
      getController,
    );

    expect(consumeResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('clears pending route when window is removed', async () => {
    const savedChrome = globalThis.chrome;
    const savedBrowser = globalThis.browser;

    try {
      jest.resetModules();

      let onRemovedListener: ((windowId: number) => void) | undefined;
      const open = jest.fn().mockResolvedValue(undefined);
      globalThis.chrome = {
        ...savedChrome,
        sidePanel: { open } as unknown as typeof savedChrome.sidePanel,
        runtime: {
          ...savedChrome.runtime,
          onMessage: {
            addListener: jest.fn(),
          } as unknown as typeof savedChrome.runtime.onMessage,
        },
        windows: {
          onRemoved: {
            addListener: jest.fn((cb: (windowId: number) => void) => {
              onRemovedListener = cb;
            }),
          } as unknown as typeof savedChrome.windows.onRemoved,
        } as unknown as typeof savedChrome.windows,
      };

      globalThis.browser = {
        runtime: {
          sendMessage: jest.fn().mockResolvedValue(undefined),
        } as unknown as typeof savedBrowser.runtime,
        tabs: {
          query: jest.fn().mockResolvedValue([]),
        } as unknown as typeof savedBrowser.tabs,
      } as unknown as typeof savedBrowser;

      const {
        createCashtagResponse: freshCreate,
        registerCashtagBackgroundBridge,
      } = await import('./background');

      registerCashtagBackgroundBridge({ getController });
      expect(onRemovedListener).toBeDefined();

      await freshCreate(openSwapMessage, widgetSender, getController);

      if (onRemovedListener) {
        onRemovedListener(7);
      }

      const consumeAfterRemove = await freshCreate(
        {
          type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
          body: { windowId: 7 },
        },
        sidePanelSender(),
        getController,
      );

      expect(consumeAfterRemove).toEqual({
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { path: null, search: null },
      });
    } finally {
      globalThis.chrome = savedChrome;
      globalThis.browser = savedBrowser;
    }
  });

  it('preserves newer pending route when earlier open rejects (identity check)', async () => {
    let firstReject: ((error: Error) => void) | undefined;
    let secondResolve: (() => void) | undefined;

    const open = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve, reject) => {
        if (firstReject) {
          secondResolve = resolve;
        } else {
          firstReject = reject;
        }
      });
    });

    Object.assign(globalThis.chrome, {
      sidePanel: { open },
    });

    const firstOpen = createCashtagResponse(
      openSwapMessage,
      widgetSender,
      getController,
    );
    const secondOpen = createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.OPEN_EXTENSION,
        body: { page: 'asset', caipAssetId },
      },
      widgetSender,
      getController,
    );

    await Promise.resolve();

    expect(open).toHaveBeenCalledTimes(2);
    expect(firstReject).toBeDefined();
    expect(secondResolve).toBeDefined();

    if (firstReject) {
      firstReject(new Error('no gesture'));
    }
    if (secondResolve) {
      secondResolve();
    }

    await Promise.allSettled([firstOpen, secondOpen]);

    const consumeResponse = await createCashtagResponse(
      {
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { windowId: 7 },
      },
      sidePanelSender(),
      getController,
    );

    expect(consumeResponse).toMatchObject({
      body: {
        path: expect.stringMatching(/^\/asset\//u),
      },
    });
  });

  it('clears pending route when side panel closes', async () => {
    const savedChrome = globalThis.chrome;
    const savedBrowser = globalThis.browser;

    try {
      jest.resetModules();

      let onClosedListener:
        | ((info: { windowId: number; path: string }) => void)
        | undefined;
      const open = jest.fn().mockResolvedValue(undefined);
      globalThis.chrome = {
        ...savedChrome,
        sidePanel: {
          open,
          onClosed: {
            addListener: jest.fn(
              (cb: (info: { windowId: number; path: string }) => void) => {
                onClosedListener = cb;
              },
            ),
          } as unknown as typeof savedChrome.sidePanel.onClosed,
        } as unknown as typeof savedChrome.sidePanel,
        runtime: {
          ...savedChrome.runtime,
          onMessage: {
            addListener: jest.fn(),
          } as unknown as typeof savedChrome.runtime.onMessage,
        },
        windows: {
          onRemoved: {
            addListener: jest.fn(),
          } as unknown as typeof savedChrome.windows.onRemoved,
        } as unknown as typeof savedChrome.windows,
      };

      globalThis.browser = {
        runtime: {
          sendMessage: jest.fn().mockResolvedValue(undefined),
        } as unknown as typeof savedBrowser.runtime,
        tabs: {
          query: jest.fn().mockResolvedValue([]),
        } as unknown as typeof savedBrowser.tabs,
      } as unknown as typeof savedBrowser;

      const {
        createCashtagResponse: freshCreate,
        registerCashtagBackgroundBridge,
      } = await import('./background');

      registerCashtagBackgroundBridge({ getController });
      expect(onClosedListener).toBeDefined();

      await freshCreate(openSwapMessage, widgetSender, getController);

      if (onClosedListener) {
        onClosedListener({ windowId: 7, path: '/sidepanel.html' });
      }

      const consumeAfterClose = await freshCreate(
        {
          type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
          body: { windowId: 7 },
        },
        sidePanelSender(),
        getController,
      );

      expect(consumeAfterClose).toEqual({
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { path: null, search: null },
      });
    } finally {
      globalThis.chrome = savedChrome;
      globalThis.browser = savedBrowser;
    }
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

  it('opens the popup without awaiting setPopup first', () => {
    const openPopup = jest.fn().mockResolvedValue(undefined);
    Object.assign(globalThis.chrome, {
      action: { openPopup, setPopup: jest.fn(pending) },
    });

    createCashtagResponse(openSwapMessage, widgetSender, getController);

    expect(openPopup).toHaveBeenCalledTimes(1);
  });

  it('opens a tab when neither the side panel nor the popup API exists', async () => {
    await createCashtagResponse(openSwapMessage, widgetSender, getController);

    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: `chrome-extension://${extensionId}/home.html${swapHash}`,
    });
  });

  it('sets bridge location to x_widget before opening swap route', async () => {
    const controller = getController();
    await createCashtagResponse(
      openSwapMessage,
      widgetSender,
      () => controller,
    );

    expect(controller.bridgeController?.setLocation).toHaveBeenCalledWith(
      'x_widget',
    );
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
