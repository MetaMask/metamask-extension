import log from 'loglevel';
import browser from 'webextension-polyfill';
import {
  HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
  type HyperliquidDepositPopupRouteMessage,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import { NOTIFICATION_MANAGER_EVENTS } from './notification-manager';

const HYPERLIQUID_DEPOSIT_POPUP_PATH =
  'notification.html#/hyperliquid-deposit';
const CURRENT_POPUP_CLOSE_TIMEOUT_MS = 2_000;

type AppStateControllerLike = {
  getCurrentPopupId: () => number | undefined;
  setCurrentPopupId: (popupId: number | undefined) => void;
};

type NotificationManagerLike = {
  on?: (eventName: string, listener: () => void) => void;
  removeListener?: (eventName: string, listener: () => void) => void;
  showPopup: (
    setCurrentPopupId: (popupId: number | undefined) => void,
    currentPopupId?: number,
    url?: string,
  ) => Promise<void>;
};

type OpenHyperliquidDepositPopupOptions = {
  appStateController: AppStateControllerLike;
  createTriggerId?: () => string;
  notificationManager: NotificationManagerLike;
  runtime?: Pick<typeof browser.runtime, 'sendMessage'>;
  tabId?: number;
  waitForCurrentPopupClose?: boolean;
  windowId?: number;
};

export async function openHyperliquidDepositPopup({
  appStateController,
  createTriggerId = createDefaultTriggerId,
  notificationManager,
  runtime = browser.runtime,
  tabId,
  waitForCurrentPopupClose = false,
  windowId,
}: OpenHyperliquidDepositPopupOptions): Promise<void> {
  const triggerId = createTriggerId();

  try {
    if (waitForCurrentPopupClose) {
      await waitForCurrentPopupCloseEvent({
        appStateController,
        notificationManager,
      });
    }

    const currentPopupId = appStateController.getCurrentPopupId();

    await notificationManager.showPopup(
      (newPopupId) => appStateController.setCurrentPopupId(newPopupId),
      currentPopupId,
      getHyperliquidDepositPopupPath(triggerId),
    );

    await notifyHyperliquidDepositPopupRoute({
      runtime,
      tabId,
      triggerId,
      windowId,
    });
  } catch (error) {
    log.warn('Unable to open Hyperliquid deposit flow in popup', {
      reason: 'popup-open-failed',
      error,
    });
  }
}

async function waitForCurrentPopupCloseEvent({
  appStateController,
  notificationManager,
}: {
  appStateController: AppStateControllerLike;
  notificationManager: NotificationManagerLike;
}): Promise<void> {
  if (
    appStateController.getCurrentPopupId() === undefined ||
    !notificationManager.on ||
    !notificationManager.removeListener
  ) {
    return;
  }

  await new Promise<void>((resolve) => {
    let isSettled = false;
    const timeoutRef: { current?: ReturnType<typeof setTimeout> } = {};

    const cleanup = () => {
      if (isSettled) {
        return;
      }

      isSettled = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      notificationManager.removeListener?.(
        NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED,
        cleanup,
      );
      resolve();
    };

    notificationManager.on?.(NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED, cleanup);
    timeoutRef.current = setTimeout(cleanup, CURRENT_POPUP_CLOSE_TIMEOUT_MS);
  });
}

export function getHyperliquidDepositPopupPath(triggerId: string): string {
  return `${HYPERLIQUID_DEPOSIT_POPUP_PATH}?trigger=${encodeURIComponent(
    triggerId,
  )}`;
}

async function notifyHyperliquidDepositPopupRoute({
  runtime,
  tabId,
  triggerId,
  windowId,
}: {
  runtime: Pick<typeof browser.runtime, 'sendMessage'>;
  tabId?: number;
  triggerId: string;
  windowId?: number;
}) {
  const payload: HyperliquidDepositPopupRouteMessage['payload'] = {
    triggerId,
  };

  if (tabId !== undefined) {
    payload.tabId = tabId;
  }

  if (windowId !== undefined) {
    payload.windowId = windowId;
  }

  try {
    await runtime.sendMessage({
      type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
      payload,
    });
  } catch (error) {
    log.debug('No open popup received Hyperliquid deposit route message', {
      error,
    });
  }
}

function createDefaultTriggerId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
