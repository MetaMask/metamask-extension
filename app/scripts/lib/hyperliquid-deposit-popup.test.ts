import { HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE } from '../../../shared/lib/hyperliquid-deposit-transaction';
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
    const runtime = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    return {
      appStateController,
      notificationManager,
      runtime,
      triggerPopupClosed: () => popupClosedListener?.(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
