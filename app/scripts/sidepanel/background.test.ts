import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import * as manifestFlags from '../../../shared/lib/manifestFlags';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import type { RootMessenger } from '../lib/messenger';
import {
  applyToolbarSidePanelBehavior,
  createSidepanelOpener,
  openRoute,
  setupSidePanelToolbarBehavior,
  shouldUseSidepanel,
  type SidePanelApiWithBehavior,
  type SidePanelBehaviorApi,
  type SidePanelToolbarBehaviorController,
} from './background';

const messageListeners: ((
  message: { type?: string; nonce?: string; body?: Record<string, unknown> },
  sender: {
    tab?: { id?: number };
    id?: string;
    url?: string;
  },
) => unknown)[] = [];

const mockRuntimeSendMessage = jest.fn().mockResolvedValue(undefined);
const TEST_EXTENSION_ID = 'testid';
const EXTENSION_ORIGIN = `chrome-extension://${TEST_EXTENSION_ID}/`;

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: (listener: (typeof messageListeners)[number]) => {
        messageListeners.push(listener);
      },
    },
    sendMessage: (...args: unknown[]) => mockRuntimeSendMessage(...args),
    getURL: (path: string) => `chrome-extension://testid/${path}`,
  },
  tabs: {
    sendMessage: jest.fn(),
    create: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('loglevel', () => ({
  warn: jest.fn(),
}));

describe('shouldUseSidepanel', () => {
  const createController = ({
    useSidePanelAsDefault = true,
    dappOpenSidepanelEnabled = true,
  } = {}) => ({
    preferencesController: {
      state: {
        preferences: {
          useSidePanelAsDefault,
        },
      },
    },
    remoteFeatureFlagController: {
      state: {
        remoteFeatureFlags: {
          dappOpenSidepanelEnabled,
        },
      },
    },
  });

  let getManifestFlagsMock: jest.SpyInstance;
  let originalChrome: typeof globalThis.chrome;

  beforeEach(() => {
    getManifestFlagsMock = jest
      .spyOn(manifestFlags, 'getManifestFlags')
      .mockReturnValue({});
    originalChrome = globalThis.chrome;
    globalThis.chrome = {
      sidePanel: {
        open: jest.fn(),
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    getManifestFlagsMock.mockRestore();
    globalThis.chrome = originalChrome;
  });

  it('returns true when preferred, supported, and flag-enabled', () => {
    expect(shouldUseSidepanel(createController())).toBe(true);
  });

  it('returns false when the user prefers popup', () => {
    expect(
      shouldUseSidepanel(createController({ useSidePanelAsDefault: false })),
    ).toBe(false);
  });

  it('returns false when sidePanel API is unavailable', () => {
    globalThis.chrome = {} as typeof chrome;
    expect(shouldUseSidepanel(createController())).toBe(false);
  });

  it('returns false when the remote flag is disabled', () => {
    expect(
      shouldUseSidepanel(createController({ dappOpenSidepanelEnabled: false })),
    ).toBe(false);
  });
});

describe('createSidepanelOpener', () => {
  const sendMessageMock = browser.tabs.sendMessage as jest.Mock;
  const originalInTest = process.env.IN_TEST;
  let sidePanelOpenMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    messageListeners.length = 0;
    jest.clearAllMocks();
    delete process.env.IN_TEST;

    sidePanelOpenMock = jest.fn().mockResolvedValue(undefined);
    global.chrome = {
      sidePanel: {
        open: sidePanelOpenMock,
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.IN_TEST = originalInTest;
    jest.restoreAllMocks();
  });

  it('resolves false when tabs.sendMessage fails', async () => {
    sendMessageMock.mockRejectedValue(new Error('no content script'));
    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('resolves false after timeout if no OPEN_SIDEPANEL reply', async () => {
    sendMessageMock.mockResolvedValue(undefined);
    const requestOpenSidePanel = createSidepanelOpener();

    const openPromise = requestOpenSidePanel(12);
    await jest.advanceTimersByTimeAsync(500);

    await expect(openPromise).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('resolves false when sidePanel.open rejects', async () => {
    sidePanelOpenMock.mockRejectedValue(new Error('no gesture'));
    sendMessageMock.mockImplementation((_tabId, message) => {
      messageListeners[0](
        {
          type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
          nonce: message.nonce,
        },
        { tab: { id: 12 } },
      );
      return Promise.resolve();
    });

    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(false);
  });

  it('resolves false when reply has no tab id', async () => {
    sendMessageMock.mockImplementation((_tabId, message) => {
      messageListeners[0](
        {
          type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
          nonce: message.nonce,
        },
        { tab: {} },
      );
      return Promise.resolve();
    });

    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('ignores OPEN_SIDEPANEL with an unknown nonce', async () => {
    sendMessageMock.mockResolvedValue(undefined);
    const requestOpenSidePanel = createSidepanelOpener();

    const openPromise = requestOpenSidePanel(12);
    messageListeners[0](
      {
        type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
        nonce: 'unknown',
      },
      { tab: { id: 12 } },
    );

    await jest.advanceTimersByTimeAsync(500);
    await expect(openPromise).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('resolves true when content script replies and sidePanel.open succeeds', async () => {
    sendMessageMock.mockImplementation((_tabId, message) => {
      messageListeners[0](
        {
          type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
          nonce: message.nonce,
        },
        { tab: { id: 12 } },
      );
      return Promise.resolve();
    });

    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(true);
    expect(sidePanelOpenMock).toHaveBeenCalledWith({ tabId: 12 });
  });
});

function createSidePanelMock(): {
  sidePanelApi: SidePanelApiWithBehavior;
  setPanelBehavior: jest.Mock;
} {
  const setPanelBehavior = jest.fn().mockResolvedValue(undefined);
  const sidePanelApi = { setPanelBehavior } satisfies SidePanelApiWithBehavior;
  return { sidePanelApi, setPanelBehavior };
}

function createSidePanelWithoutBehaviorMock(): {
  sidePanel: SidePanelBehaviorApi;
} {
  return {
    sidePanel: {},
  };
}

function createToolbarController(
  useSidePanelAsDefault = true,
): SidePanelToolbarBehaviorController {
  return {
    preferencesController: {
      state: {
        preferences: {
          useSidePanelAsDefault,
        },
      },
    },
  };
}

function sidePanelMessageSender(
  overrides?: Partial<chrome.runtime.MessageSender>,
): chrome.runtime.MessageSender {
  return {
    id: TEST_EXTENSION_ID,
    url: `${EXTENSION_ORIGIN}sidepanel.html`,
    ...overrides,
  } as chrome.runtime.MessageSender;
}

async function invokeConsumePendingRoute(
  body: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
) {
  const message = {
    type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
    body,
  };

  for (const listener of messageListeners) {
    const result = await listener(
      message,
      sender as browser.Runtime.MessageSender,
    );
    if (result !== undefined) {
      return result;
    }
  }

  return undefined;
}

describe('applyToolbarSidePanelBehavior', () => {
  const setPopup = jest.fn().mockResolvedValue(undefined);
  let originalChrome: typeof chrome;

  beforeEach(() => {
    setPopup.mockClear();
    originalChrome = globalThis.chrome;
    globalThis.chrome = {
      ...(globalThis.chrome ?? ({} as typeof chrome)),
      action: { setPopup },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
  });

  it('applies the persisted useSidePanelAsDefault preference', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();

    await applyToolbarSidePanelBehavior(
      () => createToolbarController(false),
      sidePanelApi,
    );

    expect(setPopup).toHaveBeenCalledWith({ popup: 'popup-init.html' });
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    });
  });

  it('defaults to true when preference is missing', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();

    await applyToolbarSidePanelBehavior(() => ({}), sidePanelApi);

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
    expect(setPopup).toHaveBeenCalledWith({ popup: '' });
  });
});

describe('setupSidePanelToolbarBehavior', () => {
  let consoleErrorSpy: jest.SpyInstance;
  const setPopup = jest.fn().mockResolvedValue(undefined);
  let originalChrome: typeof chrome;
  let originalStateHooks: typeof globalThis.stateHooks;
  const getPersistedState = jest.fn().mockResolvedValue({
    data: {
      PreferencesController: {
        preferences: { useSidePanelAsDefault: true },
      },
    },
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    setPopup.mockClear();
    getPersistedState.mockClear();
    getPersistedState.mockResolvedValue({
      data: {
        PreferencesController: {
          preferences: { useSidePanelAsDefault: true },
        },
      },
    });
    originalChrome = globalThis.chrome;
    originalStateHooks = globalThis.stateHooks;
    globalThis.chrome = {
      ...(globalThis.chrome ?? ({} as typeof chrome)),
      action: { setPopup },
    } as unknown as typeof chrome;
    globalThis.stateHooks = {
      ...globalThis.stateHooks,
      getPersistedState,
    };
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
    globalThis.stateHooks = originalStateHooks;
    consoleErrorSpy.mockRestore();
  });

  it('applies persisted toolbar preference before init, then reconciles after init', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();
    const subscribe = jest.fn();
    let resolveInitialization: () => void = () => undefined;
    const waitUntilInitialized = new Promise<void>((resolve) => {
      resolveInitialization = resolve;
    });
    const getController = jest
      .fn<SidePanelToolbarBehaviorController | undefined, []>()
      .mockReturnValue({
        ...createToolbarController(true),
        controllerMessenger: { subscribe },
      });

    const setupPromise = setupSidePanelToolbarBehavior(
      {
        getController,
        waitUntilInitialized: () => waitUntilInitialized,
      },
      sidePanelApi,
    );

    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    expect(getPersistedState).toHaveBeenCalledWith({ reportErrors: false });
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
    expect(setPopup).toHaveBeenCalledWith({ popup: '' });
    expect(getController).not.toHaveBeenCalled();

    resolveInitialization();
    await setupPromise;

    expect(setPanelBehavior).toHaveBeenCalledTimes(2);
    expect(subscribe).toHaveBeenCalledWith(
      'PreferencesController:stateChange',
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('does not capture a stale initialization promise', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();
    let isInitialized = new Promise<void>(() => undefined);
    const waitUntilInitialized = async () => await isInitialized;

    let resolveCurrent: () => void = () => undefined;
    isInitialized = new Promise<void>((resolve) => {
      resolveCurrent = resolve;
    });

    const setupPromise = setupSidePanelToolbarBehavior(
      {
        getController: () => createToolbarController(),
        waitUntilInitialized,
      },
      sidePanelApi,
    );

    resolveCurrent();
    await setupPromise;

    expect(setPanelBehavior).toHaveBeenCalledTimes(2);
  });

  it('updates panel behavior when preference subscription fires', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();
    let preferenceChangeHandler:
      | ((useSidePanelAsDefault: boolean) => void)
      | undefined;
    const subscribe = jest.fn(
      (_event: string, callback: (useSidePanelAsDefault: boolean) => void) => {
        preferenceChangeHandler = callback;
      },
    );

    await setupSidePanelToolbarBehavior(
      {
        getController: () => ({
          ...createToolbarController(true),
          controllerMessenger: { subscribe },
        }),
        waitUntilInitialized: () => Promise.resolve(),
      },
      sidePanelApi,
    );

    setPanelBehavior.mockClear();
    preferenceChangeHandler?.(false);

    await Promise.resolve();
    await Promise.resolve();
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    });
  });

  it('uses the selector to read useSidePanelAsDefault from preferences state', async () => {
    const { sidePanelApi } = createSidePanelMock();
    let selector: ((state: PreferencesControllerState) => boolean) | undefined;
    const subscribe = jest.fn(
      (
        _event: string,
        _callback: (useSidePanelAsDefault: boolean) => void,
        nextSelector: (state: PreferencesControllerState) => boolean,
      ) => {
        selector = nextSelector;
      },
    );

    await setupSidePanelToolbarBehavior(
      {
        getController: () => ({
          controllerMessenger: {
            subscribe: subscribe as unknown as RootMessenger['subscribe'],
          },
        }),
        waitUntilInitialized: () => Promise.resolve(),
      },
      sidePanelApi,
    );

    expect(
      selector?.({
        preferences: {
          useSidePanelAsDefault: false,
        },
      } as PreferencesControllerState),
    ).toBe(false);
    expect(
      selector?.({
        preferences: {},
      } as PreferencesControllerState),
    ).toBe(true);
  });

  it('logs an error when initialization fails', async () => {
    const { sidePanelApi } = createSidePanelMock();

    await setupSidePanelToolbarBehavior(
      {
        getController: () => createToolbarController(),
        waitUntilInitialized: () => Promise.reject(new Error('init failed')),
      },
      sidePanelApi,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error setting side panel toolbar behavior:',
      expect.any(Error),
    );
  });

  it('logs an error when preference updates fail', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();
    let preferenceChangeHandler:
      | ((useSidePanelAsDefault: boolean) => void)
      | undefined;
    const subscribe = jest.fn(
      (_event: string, callback: (useSidePanelAsDefault: boolean) => void) => {
        preferenceChangeHandler = callback;
      },
    );

    await setupSidePanelToolbarBehavior(
      {
        getController: () => ({
          controllerMessenger: { subscribe },
        }),
        waitUntilInitialized: () => Promise.resolve(),
      },
      sidePanelApi,
    );

    setPanelBehavior.mockRejectedValue(new Error('update failed'));
    preferenceChangeHandler?.(false);
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error updating panel behavior:',
      expect.any(Error),
    );
  });

  it('restores popup-init when sidePanel API is unavailable', async () => {
    const { sidePanel } = createSidePanelWithoutBehaviorMock();
    const getController = jest.fn(() => createToolbarController());

    await expect(
      setupSidePanelToolbarBehavior(
        {
          getController,
          waitUntilInitialized: () => Promise.resolve(),
        },
        sidePanel,
      ),
    ).resolves.toBeUndefined();
    expect(setPopup).toHaveBeenCalledWith({ popup: 'popup-init.html' });
    expect(getController).not.toHaveBeenCalled();
  });

  it('restores popup-init from persisted state before init when popup is preferred', async () => {
    getPersistedState.mockResolvedValue({
      data: {
        PreferencesController: {
          preferences: { useSidePanelAsDefault: false },
        },
      },
    });
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();
    let resolveInitialization: () => void = () => undefined;
    const waitUntilInitialized = new Promise<void>((resolve) => {
      resolveInitialization = resolve;
    });

    const setupPromise = setupSidePanelToolbarBehavior(
      {
        getController: () => createToolbarController(false),
        waitUntilInitialized: () => waitUntilInitialized,
      },
      sidePanelApi,
    );

    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    expect(setPopup).toHaveBeenCalledWith({ popup: 'popup-init.html' });
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    });

    resolveInitialization();
    await setupPromise;
  });
});

describe('pending routes', () => {
  const swapPath = '/cross-chain/swaps/prepare-bridge-page';
  const swapSearch = '?to=eip155%3A1%2Fslip44%3A60' as `?${string}`;
  const assetPath = '/asset/eip155:1/slip44:60';

  let openRouteFresh: typeof openRoute;
  let sidePanelOpenMock: jest.Mock;
  let onRemovedListener: ((windowId: number) => void) | undefined;
  let originalChrome: typeof chrome;

  beforeEach(async () => {
    jest.resetModules();
    jest.useFakeTimers();
    messageListeners.length = 0;
    mockRuntimeSendMessage.mockClear();
    mockRuntimeSendMessage.mockResolvedValue(undefined);
    onRemovedListener = undefined;
    sidePanelOpenMock = jest.fn();

    originalChrome = globalThis.chrome;
    globalThis.chrome = {
      runtime: {
        id: TEST_EXTENSION_ID,
        getURL: (path: string) => `${EXTENSION_ORIGIN}${path}`,
      },
      sidePanel: { open: sidePanelOpenMock },
      action: {
        setPopup: jest.fn().mockResolvedValue(undefined),
        openPopup: jest.fn().mockResolvedValue(undefined),
      },
      windows: {
        onRemoved: {
          addListener: jest.fn((callback: (windowId: number) => void) => {
            onRemovedListener = callback;
          }),
        },
      },
    } as unknown as typeof chrome;

    const backgroundModule = await import('./background');
    openRouteFresh = backgroundModule.openRoute;
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.chrome = originalChrome;
  });

  it('sets pending route before side panel open resolves', async () => {
    let consumeDuringOpen: Promise<unknown> | undefined;
    sidePanelOpenMock.mockImplementation(() => {
      consumeDuringOpen = invokeConsumePendingRoute(
        { windowId: 7 },
        sidePanelMessageSender(),
      );
      return Promise.resolve(undefined);
    });

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    expect(sidePanelOpenMock).toHaveBeenCalledWith({ windowId: 7 });
    expect(mockRuntimeSendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_ROUTE,
      body: { windowId: 7 },
    });
    await expect(consumeDuringOpen).resolves.toMatchObject({
      body: { path: swapPath, search: swapSearch },
    });
  });

  it('deletes pending route when side panel open rejects', async () => {
    sidePanelOpenMock.mockRejectedValue(new Error('no gesture'));

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    expect(mockRuntimeSendMessage).not.toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_ROUTE,
      body: { windowId: 7 },
    });

    const consumeResponse = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );

    expect(consumeResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('preserves newer pending route when an earlier open rejects', async () => {
    let firstReject: ((error: Error) => void) | undefined;
    let secondResolve: (() => void) | undefined;

    sidePanelOpenMock.mockImplementation(() => {
      return new Promise<void>((resolve, reject) => {
        if (firstReject) {
          secondResolve = resolve;
        } else {
          firstReject = reject;
        }
      });
    });

    const firstOpen = openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });
    const secondOpen = openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: assetPath,
    });

    await Promise.resolve();

    expect(sidePanelOpenMock).toHaveBeenCalledTimes(2);
    firstReject?.(new Error('no gesture'));
    secondResolve?.();
    await Promise.allSettled([firstOpen, secondOpen]);

    const consumeResponse = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );

    expect(consumeResponse).toMatchObject({
      body: { path: assetPath },
    });
  });

  it('consumes pending route once and returns null afterward', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    const firstResponse = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );
    expect(firstResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: swapPath, search: swapSearch },
    });

    const secondResponse = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );
    expect(secondResponse).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('isolates pending routes per browser window', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });
    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 8,
      path: assetPath,
    });

    const window7Response = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );
    expect(window7Response).toMatchObject({
      body: { path: swapPath },
    });

    const window8Response = await invokeConsumePendingRoute(
      { windowId: 8 },
      sidePanelMessageSender(),
    );
    expect(window8Response).toMatchObject({
      body: { path: assetPath },
    });
  });

  it('returns null when consuming with missing or invalid windowId', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    await expect(
      invokeConsumePendingRoute({}, sidePanelMessageSender()),
    ).resolves.toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    await expect(
      invokeConsumePendingRoute(
        { windowId: 'not-a-number' },
        sidePanelMessageSender(),
      ),
    ).resolves.toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('clears pending route when the browser window is removed', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    onRemovedListener?.(7);

    const consumeAfterRemove = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );

    expect(consumeAfterRemove).toEqual({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
  });

  it('replaces pending route when openRoute is called again before consume', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: assetPath,
    });
    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    const consume = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );

    expect(consume).toMatchObject({
      body: { path: swapPath, search: swapSearch },
    });
  });

  it('rejects CONSUME_PENDING_ROUTE from content scripts', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    const consumeResponse = await invokeConsumePendingRoute({ windowId: 7 }, {
      id: TEST_EXTENSION_ID,
      tab: { id: 1 } as chrome.tabs.Tab,
      url: 'https://x.com/home',
    } as chrome.runtime.MessageSender);

    expect(consumeResponse).toBeUndefined();
  });

  it('rejects CONSUME_PENDING_ROUTE when sender is an extension page with a tab', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    const consumeResponse = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender({
        tab: { id: 1 } as chrome.tabs.Tab,
      }),
    );

    expect(consumeResponse).toBeUndefined();
  });

  it('allows CONSUME_PENDING_ROUTE from extension pages without a tab', async () => {
    sidePanelOpenMock.mockResolvedValue(undefined);

    await openRouteFresh({
      controller: createToolbarController(true),
      windowId: 7,
      path: swapPath,
      search: swapSearch,
    });

    const consumeResponse = await invokeConsumePendingRoute(
      { windowId: 7 },
      sidePanelMessageSender(),
    );

    expect(consumeResponse).toMatchObject({
      body: { path: swapPath, search: swapSearch },
    });
  });
});

describe('openRoute', () => {
  const setPopup = jest.fn().mockResolvedValue(undefined);
  const openPopup = jest.fn().mockResolvedValue(undefined);
  let originalChrome: typeof chrome;

  beforeEach(() => {
    jest.useFakeTimers();
    setPopup.mockClear();
    openPopup.mockClear();
    originalChrome = globalThis.chrome;
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.chrome = originalChrome;
  });

  it('clears the toolbar popup after a side-panel fallback', async () => {
    globalThis.chrome = {
      sidePanel: {
        open: jest.fn().mockRejectedValue(new Error('side panel unavailable')),
      },
      action: { setPopup, openPopup },
    } as unknown as typeof chrome;

    await openRoute({
      controller: createToolbarController(true),
      windowId: 1,
      path: '/swap',
    });

    await jest.advanceTimersByTimeAsync(1000);

    expect(setPopup).toHaveBeenLastCalledWith({ popup: '' });
  });

  it('restores popup-init.html when the popup is preferred', async () => {
    globalThis.chrome = {
      action: { setPopup, openPopup },
    } as unknown as typeof chrome;

    await openRoute({
      controller: createToolbarController(false),
      windowId: 1,
      path: '/swap',
    });

    await jest.advanceTimersByTimeAsync(1000);

    expect(setPopup).toHaveBeenLastCalledWith({ popup: 'popup-init.html' });
  });
});
