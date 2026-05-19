import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import {
  HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
  HYPERLIQUID_DEPOSIT_ROUTE_ACK_MESSAGE,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import {
  getHyperliquidDepositPopupPath,
  openHyperliquidDepositPopup,
} from './hyperliquid-deposit-popup';

jest.mock('loglevel', () => ({ debug: jest.fn(), warn: jest.fn() }));
const mockLogDebug = jest.requireMock('loglevel').debug;
const mockLogWarn = jest.requireMock('loglevel').warn;

describe('hyperliquid-deposit-popup', () => {
  const getDependencies = () => {
    let popupClosedListener: (() => void) | undefined;
    const appStateController = {
      getCurrentPopupId: jest.fn().mockReturnValue(456),
      setCurrentPopupId: jest.fn(),
    };
    const notificationManager = {
      on: jest.fn((_eventName, listener) => {
        popupClosedListener = listener;
      }),
      removeListener: jest.fn(),
      showPopup: jest.fn().mockResolvedValue(undefined),
    };
    const routeMessageListeners = new Set<(message: unknown) => void>();
    const runtime = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      onMessage: {
        addListener: jest.fn((listener) => {
          routeMessageListeners.add(listener);
        }),
        removeListener: jest.fn((listener) => {
          routeMessageListeners.delete(listener);
        }),
      },
    };

    return {
      appStateController,
      notificationManager,
      runtime,
      routeMessageListeners,
      triggerPopupClosed: () => popupClosedListener?.(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('builds the Hyperliquid deposit popup route', () => {
    expect(getHyperliquidDepositPopupPath('trigger 1')).toBe(
      'notification.html#/hyperliquid-deposit?trigger=trigger%201',
    );
  });

  it('opens the Hyperliquid deposit popup and routes existing popups', async () => {
    const { appStateController, notificationManager, runtime } =
      getDependencies();

    await openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-1',
      notificationManager,
      runtime,
      tabId: 123,
      windowId: 789,
    });

    expect(notificationManager.showPopup).toHaveBeenCalledWith(
      expect.any(Function),
      456,
      'notification.html#/hyperliquid-deposit?trigger=trigger-1',
    );
    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload: {
        tabId: 123,
        triggerId: 'trigger-1',
        windowId: 789,
      },
    });
  });

  it('waits for the current popup to close before opening a new popup', async () => {
    const {
      appStateController,
      notificationManager,
      runtime,
      triggerPopupClosed,
    } = getDependencies();
    appStateController.getCurrentPopupId
      .mockReturnValueOnce(456)
      .mockReturnValueOnce(undefined);

    const popupPromise = openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-after-signature',
      notificationManager,
      runtime,
      tabId: 123,
      waitForCurrentPopupClose: true,
    });

    expect(notificationManager.showPopup).not.toHaveBeenCalled();

    triggerPopupClosed();
    await popupPromise;

    expect(notificationManager.showPopup).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      'notification.html#/hyperliquid-deposit?trigger=trigger-after-signature',
    );
    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload: {
        tabId: 123,
        triggerId: 'trigger-after-signature',
      },
    });
  });

  it('omits optional tab and window ids from the route message', async () => {
    const { appStateController, notificationManager, runtime } =
      getDependencies();

    await openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-2',
      notificationManager,
      runtime,
    });

    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload: {
        triggerId: 'trigger-2',
      },
    });
  });

  it('routes to an open sidepanel instead of opening a popup', async () => {
    const {
      appStateController,
      notificationManager,
      routeMessageListeners,
      runtime,
    } = getDependencies();

    runtime.sendMessage.mockImplementation(async (message) => {
      if (message.type === HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE) {
        routeMessageListeners.forEach((listener) =>
          listener({
            type: HYPERLIQUID_DEPOSIT_ROUTE_ACK_MESSAGE,
            payload: {
              triggerId: 'trigger-sidepanel',
              environmentType: 'sidepanel',
            },
          }),
        );
      }
    });

    await openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-sidepanel',
      notificationManager,
      hasOpenSidePanel: jest.fn().mockResolvedValue(true),
      preferExistingSidePanel: true,
      runtime,
      tabId: 123,
    });

    expect(notificationManager.showPopup).not.toHaveBeenCalled();
    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload: {
        target: 'sidepanel',
        tabId: 123,
        triggerId: 'trigger-sidepanel',
      },
    });
  });

  it('waits for the current popup to close before routing to an open sidepanel', async () => {
    const {
      appStateController,
      notificationManager,
      routeMessageListeners,
      runtime,
      triggerPopupClosed,
    } = getDependencies();
    appStateController.getCurrentPopupId.mockReturnValue(456);

    runtime.sendMessage.mockImplementation(async (message) => {
      if (message.type === HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE) {
        routeMessageListeners.forEach((listener) =>
          listener({
            type: HYPERLIQUID_DEPOSIT_ROUTE_ACK_MESSAGE,
            payload: {
              triggerId: 'trigger-after-signature',
              environmentType: 'sidepanel',
            },
          }),
        );
      }
    });

    const popupPromise = openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-after-signature',
      notificationManager,
      hasOpenSidePanel: jest.fn().mockResolvedValue(true),
      preferExistingSidePanel: true,
      runtime,
      waitForCurrentPopupClose: true,
    });

    expect(runtime.sendMessage).not.toHaveBeenCalled();
    expect(notificationManager.showPopup).not.toHaveBeenCalled();

    triggerPopupClosed();
    await popupPromise;

    expect(notificationManager.showPopup).not.toHaveBeenCalled();
    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload: {
        target: 'sidepanel',
        triggerId: 'trigger-after-signature',
      },
    });
  });

  it('does not probe sidepanel routing when no sidepanel is open', async () => {
    const { appStateController, notificationManager, runtime } =
      getDependencies();

    await openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-no-sidepanel',
      hasOpenSidePanel: jest.fn().mockResolvedValue(false),
      notificationManager,
      preferExistingSidePanel: true,
      runtime,
    });

    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload: {
        triggerId: 'trigger-no-sidepanel',
      },
    });
    expect(runtime.sendMessage).not.toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload: {
        target: 'sidepanel',
        triggerId: 'trigger-no-sidepanel',
      },
    });
    expect(notificationManager.showPopup).toHaveBeenCalledWith(
      expect.any(Function),
      456,
      'notification.html#/hyperliquid-deposit?trigger=trigger-no-sidepanel',
    );
  });

  it('ignores non-sidepanel route acknowledgements and falls back to a popup', async () => {
    jest.useFakeTimers();
    const {
      appStateController,
      notificationManager,
      routeMessageListeners,
      runtime,
    } = getDependencies();

    runtime.sendMessage.mockImplementation(async (message) => {
      if (message.type === HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE) {
        routeMessageListeners.forEach((listener) =>
          listener({
            type: HYPERLIQUID_DEPOSIT_ROUTE_ACK_MESSAGE,
            payload: {
              triggerId: 'trigger-notification',
              environmentType: ENVIRONMENT_TYPE_NOTIFICATION,
            },
          }),
        );
      }
    });

    const popupPromise = openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-notification',
      hasOpenSidePanel: jest.fn().mockResolvedValue(true),
      notificationManager,
      preferExistingSidePanel: true,
      runtime,
      sidePanelRouteTimeoutMs: 10,
    });

    await Promise.resolve();
    jest.advanceTimersByTime(10);
    await popupPromise;

    expect(notificationManager.showPopup).toHaveBeenCalledWith(
      expect.any(Function),
      456,
      'notification.html#/hyperliquid-deposit?trigger=trigger-notification',
    );
  });

  it('logs when opening the popup fails', async () => {
    const { appStateController, notificationManager, runtime } =
      getDependencies();
    const error = new Error('Popup failed');
    notificationManager.showPopup.mockRejectedValue(error);

    await openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-3',
      notificationManager,
      runtime,
    });

    expect(runtime.sendMessage).not.toHaveBeenCalled();
    expect(mockLogWarn).toHaveBeenCalledWith(
      'Unable to open Hyperliquid deposit flow in popup',
      {
        reason: 'popup-open-failed',
        error,
      },
    );
  });

  it('logs when no open popup receives the route message', async () => {
    const { appStateController, notificationManager, runtime } =
      getDependencies();
    const error = new Error('No receiver');
    runtime.sendMessage.mockRejectedValue(error);

    await openHyperliquidDepositPopup({
      appStateController,
      createTriggerId: () => 'trigger-4',
      notificationManager,
      runtime,
    });

    expect(notificationManager.showPopup).toHaveBeenCalledTimes(1);
    expect(mockLogDebug).toHaveBeenCalledWith(
      'No open popup received Hyperliquid deposit route message',
      { error },
    );
  });
});
