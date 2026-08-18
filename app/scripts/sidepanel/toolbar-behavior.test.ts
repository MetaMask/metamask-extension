import type { PreferencesControllerState } from '../controllers/preferences-controller';
import type { RootMessenger } from '../lib/messenger';
import {
  applyEarlySidePanelToolbarBehavior,
  applyToolbarSidePanelBehavior,
  setupSidePanelToolbarBehavior,
  type SidePanelBehaviorApi,
  type SidePanelToolbarBehaviorController,
} from './toolbar-behavior';

function createSidePanelMock() {
  const setPanelBehavior = jest.fn().mockResolvedValue(undefined);
  return {
    sidePanel: { setPanelBehavior } satisfies SidePanelBehaviorApi,
    setPanelBehavior,
  };
}

function createSidePanelWithoutBehaviorMock() {
  return {
    sidePanel: {} satisfies SidePanelBehaviorApi,
  };
}

function createController(
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
    const { sidePanel, setPanelBehavior } = createSidePanelMock();

    applyEarlySidePanelToolbarBehavior(sidePanel);

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it('does nothing when setPanelBehavior is unavailable', () => {
    const { sidePanel } = createSidePanelWithoutBehaviorMock();

    expect(sidePanel.setPanelBehavior).toBeUndefined();
    applyEarlySidePanelToolbarBehavior(sidePanel);
  });

  it('ignores setPanelBehavior rejection', async () => {
    const { sidePanel, setPanelBehavior } = createSidePanelMock();
    setPanelBehavior.mockRejectedValue(new Error('side panel unavailable'));

    applyEarlySidePanelToolbarBehavior(sidePanel);

    await Promise.resolve();
    expect(setPanelBehavior).toHaveBeenCalledTimes(1);
  });
});

describe('applyToolbarSidePanelBehavior', () => {
  it('applies the persisted useSidePanelAsDefault preference', async () => {
    const { sidePanel, setPanelBehavior } = createSidePanelMock();

    await applyToolbarSidePanelBehavior(
      () => createController(false),
      sidePanel,
    );

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    });
  });

  it('defaults to true when preference is missing', async () => {
    const { sidePanel, setPanelBehavior } = createSidePanelMock();

    await applyToolbarSidePanelBehavior(() => ({}), sidePanel);

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it('does nothing when setPanelBehavior is unavailable', async () => {
    const { sidePanel } = createSidePanelWithoutBehaviorMock();
    const getController = jest.fn(() => createController(false));

    await expect(
      applyToolbarSidePanelBehavior(getController, sidePanel),
    ).resolves.toBeUndefined();
    expect(getController).not.toHaveBeenCalled();
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

  it('waits for initialization, applies preference, and subscribes to changes', async () => {
    const { sidePanel, setPanelBehavior } = createSidePanelMock();
    const subscribe = jest.fn();
    let resolveInitialization: () => void = () => undefined;
    const waitUntilInitialized = new Promise<void>((resolve) => {
      resolveInitialization = resolve;
    });
    const getController = jest
      .fn<SidePanelToolbarBehaviorController | undefined, []>()
      .mockReturnValue({
        ...createController(true),
        controllerMessenger: { subscribe },
      });

    const setupPromise = setupSidePanelToolbarBehavior(
      {
        getController,
        waitUntilInitialized,
      },
      sidePanel,
    );

    expect(setPanelBehavior).not.toHaveBeenCalled();
    resolveInitialization();
    await setupPromise;

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
    expect(subscribe).toHaveBeenCalledWith(
      'PreferencesController:stateChange',
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('updates panel behavior when preference subscription fires', async () => {
    const { sidePanel, setPanelBehavior } = createSidePanelMock();
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
          ...createController(true),
          controllerMessenger: { subscribe },
        }),
        waitUntilInitialized: Promise.resolve(),
      },
      sidePanel,
    );

    setPanelBehavior.mockClear();
    preferenceChangeHandler?.(false);

    await Promise.resolve();
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    });
  });

  it('uses the selector to read useSidePanelAsDefault from preferences state', async () => {
    const { sidePanel } = createSidePanelMock();
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
        waitUntilInitialized: Promise.resolve(),
      },
      sidePanel,
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
    const { sidePanel } = createSidePanelMock();

    await setupSidePanelToolbarBehavior(
      {
        getController: () => createController(),
        waitUntilInitialized: Promise.reject(new Error('init failed')),
      },
      sidePanel,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error setting side panel toolbar behavior:',
      expect.any(Error),
    );
  });

  it('logs an error when preference updates fail', async () => {
    const { sidePanel, setPanelBehavior } = createSidePanelMock();
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
        waitUntilInitialized: Promise.resolve(),
      },
      sidePanel,
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
    const getController = jest.fn(() => createController());

    await expect(
      setupSidePanelToolbarBehavior(
        {
          getController,
          waitUntilInitialized: Promise.resolve(),
        },
        sidePanel,
      ),
    ).resolves.toBeUndefined();
    expect(getController).not.toHaveBeenCalled();
  });
});
