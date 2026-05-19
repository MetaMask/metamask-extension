import log from 'loglevel';
import browser from 'webextension-polyfill';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../shared/constants/app';
import {
  HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
  HYPERLIQUID_DEPOSIT_ROUTE_TARGET_SIDEPANEL,
  type HyperliquidDepositPopupRouteMessage,
  isHyperliquidDepositRouteAckMessage,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import { NOTIFICATION_MANAGER_EVENTS } from './notification-manager';

const HYPERLIQUID_DEPOSIT_POPUP_PATH =
  'notification.html#/hyperliquid-deposit';
const CURRENT_POPUP_CLOSE_TIMEOUT_MS = 2_000;
const SIDE_PANEL_ROUTE_TIMEOUT_MS = 250;

type RuntimeOnMessageListener = Parameters<
  typeof browser.runtime.onMessage.addListener
>[0];

type RuntimeLike = Pick<typeof browser.runtime, 'sendMessage'> & {
  onMessage?: Pick<
    typeof browser.runtime.onMessage,
    'addListener' | 'removeListener'
  >;
};

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
  hasOpenSidePanel?: () => Promise<boolean>;
  notificationManager: NotificationManagerLike;
  preferExistingSidePanel?: boolean;
  runtime?: RuntimeLike;
  sidePanelRouteTimeoutMs?: number;
  tabId?: number;
  waitForCurrentPopupClose?: boolean;
  windowId?: number;
};

export async function openHyperliquidDepositPopup({
  appStateController,
  createTriggerId = createDefaultTriggerId,
  hasOpenSidePanel = detectOpenSidePanel,
  notificationManager,
  preferExistingSidePanel = false,
  runtime = browser.runtime,
  sidePanelRouteTimeoutMs = SIDE_PANEL_ROUTE_TIMEOUT_MS,
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

    if (
      preferExistingSidePanel &&
      (await routeExistingSidePanel({
        hasOpenSidePanel,
        runtime,
        sidePanelRouteTimeoutMs,
        tabId,
        triggerId,
        windowId,
      }))
    ) {
      return;
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
  target,
  triggerId,
  windowId,
}: {
  runtime: Pick<typeof browser.runtime, 'sendMessage'>;
  tabId?: number;
  target?: HyperliquidDepositPopupRouteMessage['payload']['target'];
  triggerId: string;
  windowId?: number;
}): Promise<boolean> {
  const payload: HyperliquidDepositPopupRouteMessage['payload'] = {
    triggerId,
  };

  if (target !== undefined) {
    payload.target = target;
  }

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
    return true;
  } catch (error) {
    log.debug('No open popup received Hyperliquid deposit route message', {
      error,
    });
    return false;
  }
}

async function routeExistingSidePanel({
  hasOpenSidePanel,
  runtime,
  sidePanelRouteTimeoutMs,
  tabId,
  triggerId,
  windowId,
}: {
  hasOpenSidePanel: () => Promise<boolean>;
  runtime: RuntimeLike;
  sidePanelRouteTimeoutMs: number;
  tabId?: number;
  triggerId: string;
  windowId?: number;
}): Promise<boolean> {
  if (!runtime.onMessage || !(await hasOpenSidePanel())) {
    return false;
  }

  const { onMessage } = runtime;

  return await new Promise<boolean>((resolve) => {
    let isSettled = false;
    const timeoutRef: { current?: ReturnType<typeof setTimeout> } = {};

    const listener: RuntimeOnMessageListener = (message) => {
      if (
        isHyperliquidDepositRouteAckMessage(message) &&
        message.payload.triggerId === triggerId &&
        message.payload.environmentType === ENVIRONMENT_TYPE_SIDEPANEL
      ) {
        cleanup(true);
      }

      return undefined;
    };

    function cleanup(handled: boolean) {
      if (isSettled) {
        return;
      }

      isSettled = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      onMessage.removeListener(listener);
      resolve(handled);
    }

    onMessage.addListener(listener);
    timeoutRef.current = setTimeout(
      () => cleanup(false),
      sidePanelRouteTimeoutMs,
    );

    notifyHyperliquidDepositPopupRoute({
      runtime,
      tabId,
      target: HYPERLIQUID_DEPOSIT_ROUTE_TARGET_SIDEPANEL,
      triggerId,
      windowId,
    }).then((messageSent) => {
      if (!messageSent) {
        cleanup(false);
      }
    });
  });
}

async function detectOpenSidePanel(): Promise<boolean> {
  if (!globalThis.chrome?.runtime || !('getContexts' in chrome.runtime)) {
    return false;
  }

  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['SIDE_PANEL' as chrome.runtime.ContextType],
  });

  return contexts.length > 0;
}

function createDefaultTriggerId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
