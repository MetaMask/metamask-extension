import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import * as manifestFlags from '../../../shared/lib/manifestFlags';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import type { RootMessenger } from '../lib/messenger';
import {
  applyEarlySidePanelToolbarBehavior,
  applyToolbarSidePanelBehavior,
  createSidepanelOpener,
  setupSidePanelToolbarBehavior,
  shouldUseSidepanel,
  type SidePanelApiWithBehavior,
  type SidePanelBehaviorApi,
  type SidePanelToolbarBehaviorController,
} from './background';

const messageListeners: ((
  message: { type?: string; nonce?: string },
  sender: { tab?: { id?: number } },
) => unknown)[] = [];

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: (listener: (typeof messageListeners)[number]) => {
        messageListeners.push(listener);
      },
    },
  },
  tabs: {
    sendMessage: jest.fn(),
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

describe('applyEarlySidePanelToolbarBehavior', () => {
  it('sets openPanelOnActionClick to true when sidePanel API is available', () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();

    applyEarlySidePanelToolbarBehavior(sidePanelApi);

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it('ignores setPanelBehavior rejection', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();
    setPanelBehavior.mockRejectedValue(new Error('side panel unavailable'));

    applyEarlySidePanelToolbarBehavior(sidePanelApi);

    await Promise.resolve();
    expect(setPanelBehavior).toHaveBeenCalledTimes(1);
  });
});

describe('applyToolbarSidePanelBehavior', () => {
  it('applies the persisted useSidePanelAsDefault preference', async () => {
    const { sidePanelApi, setPanelBehavior } = createSidePanelMock();

    await applyToolbarSidePanelBehavior(
      () => createToolbarController(false),
      sidePanelApi,
    );

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
  });
});

describe('setupSidePanelToolbarBehavior', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('applies early toolbar behavior before init, then preference and subscription', async () => {
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

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
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

    setPanelBehavior.mockRejectedValueOnce(new Error('update failed'));
    preferenceChangeHandler?.(false);
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error updating panel behavior:',
      expect.any(Error),
    );
  });

  it('does nothing when sidePanel API is unavailable', async () => {
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
    expect(getController).not.toHaveBeenCalled();
  });
});
