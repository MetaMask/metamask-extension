import type { RampsController } from '@metamask/ramps-controller';
import { getRampCallbackBaseUrl } from '../../../../shared/lib/ramps/callback-url';
import type ExtensionPlatform from '../../platforms/extension';
import {
  trackRampsTerminalOrder,
  trackRampsTransactionConfirmed,
} from './handleRampsOrderStatusChanged';
import {
  trackRampsCheckoutCallbackDetected,
  trackRampsCheckoutClosed,
  trackRampsCheckoutOpened,
  type RampsCheckoutAnalyticsContext,
} from './trackRampsCheckoutAnalytics';

export type WatchRampsCheckoutTabParams = {
  /**
   * Provider checkout URL. Opened in the background so popup-mode UI can die
   * after dispatching this call without losing the tab watcher.
   */
  url: string;
  providerCode: string;
  walletAddress: string;
  /**
   * Widget order id, when the provider returned one. Used only as a fallback
   * lookup if resolving from the callback URL fails.
   */
  orderCode?: string;
  checkoutSessionId: string;
  region?: string;
  providerName?: string;
};

type ActiveWatch = {
  cleanup: () => void;
};

/**
 * Background watcher for provider checkout tabs navigating to the ramps
 * callback URL.
 *
 * Opens the checkout tab in the background (so popup-mode UI can close safely),
 * then watches for navigation to the ramps callback URL. Fires checkout
 * analytics (callback-detected, checkout-closed, transaction-confirmed,
 * terminal KPI) from the background so they survive popup unload.
 *
 * @param platform - Extension platform (tab listeners / closeTab).
 * @param rampsController - Controller used to resolve redirect-only orders.
 * @returns A `watchRampsCheckoutTab` function suitable for the background API.
 */
export function createWatchRampsCheckoutTab(
  platform: ExtensionPlatform,
  rampsController: RampsController,
): (params: WatchRampsCheckoutTabParams) => Promise<void> {
  const activeByTabId = new Map<number, ActiveWatch>();

  function startWatching({
    tabId,
    providerCode,
    walletAddress,
    orderCode,
    analyticsContext,
  }: {
    tabId: number;
    providerCode: string;
    walletAddress: string;
    orderCode?: string;
    analyticsContext: RampsCheckoutAnalyticsContext;
  }): void {
    activeByTabId.get(tabId)?.cleanup();

    let stepIndex = 0;
    let lastNavigationUrl: string | undefined;

    const cleanup = () => {
      platform.removeTabUpdatedListener(onUpdated);
      platform.removeTabRemovedListener(onRemoved);
      activeByTabId.delete(tabId);
    };

    const resolveOrder = async (callbackUrl: string): Promise<void> => {
      try {
        const order = await rampsController.getOrderFromCallback(
          providerCode,
          callbackUrl,
          walletAddress,
        );
        rampsController.addOrder(order);
        trackRampsTransactionConfirmed(
          order,
          analyticsContext.region,
          analyticsContext.checkoutSessionId,
        );
        trackRampsTerminalOrder(order, analyticsContext.checkoutSessionId);
        return;
      } catch (callbackError) {
        console.error(
          'Failed to resolve ramps order from callback',
          callbackError,
        );
      }

      if (!orderCode) {
        return;
      }

      try {
        const order = await rampsController.getOrder(
          providerCode,
          orderCode,
          walletAddress,
        );
        rampsController.addOrder(order);
        trackRampsTransactionConfirmed(
          order,
          analyticsContext.region,
          analyticsContext.checkoutSessionId,
        );
        trackRampsTerminalOrder(order, analyticsContext.checkoutSessionId);
      } catch (error) {
        console.error('Failed to resolve ramps order by code', error);
      }
    };

    const finish = (callbackUrl?: string) => {
      cleanup();

      // Resolve first, then open MetaMask UI before closing the checkout tab.
      // Closing the only open tab would quit Chrome and drop the in-memory
      // order before the user can see toasts / Activity.
      (async () => {
        if (callbackUrl) {
          await resolveOrder(callbackUrl);
        }

        try {
          await platform.openTab({
            url: platform.getExtensionURL('/activity'),
          });
        } catch {
          // Best-effort UI reopen; still close the checkout tab below.
        }

        await platform.closeTab(tabId).catch(() => undefined);
      })().catch(() => undefined);
    };

    function onUpdated(
      updatedTabId: number,
      changeInfo: { url?: string; pendingUrl?: string },
    ): void {
      if (updatedTabId !== tabId) {
        return;
      }

      // Only count a step when the URL is actually changing in this update
      // event — tab-updated fires for title/favicon/status changes too, and
      // falling back to tab?.url would count those as navigations.
      const navigationUrl = changeInfo.url ?? changeInfo.pendingUrl;
      if (!navigationUrl) {
        return;
      }

      // A single navigation can surface twice: once as `pendingUrl` when it is
      // committed and again as `url` once it loads. Count distinct URLs so
      // `step_index` stays comparable to mobile's, which dedupes the same way.
      if (navigationUrl === lastNavigationUrl) {
        return;
      }
      lastNavigationUrl = navigationUrl;

      stepIndex += 1;

      if (!navigationUrl.startsWith(getRampCallbackBaseUrl())) {
        return;
      }

      trackRampsCheckoutCallbackDetected(
        analyticsContext,
        navigationUrl,
        stepIndex,
      );
      trackRampsCheckoutClosed(analyticsContext, {
        closeSource: 'callback_success',
        callbackReached: true,
        stepIndex,
      });
      finish(navigationUrl);
    }

    function onRemoved(removedTabId: number): void {
      if (removedTabId !== tabId) {
        return;
      }
      trackRampsCheckoutClosed(analyticsContext, {
        closeSource: 'user_close_button',
        callbackReached: false,
        stepIndex,
      });
      cleanup();
    }

    activeByTabId.set(tabId, { cleanup });
    platform.addTabUpdatedListener(onUpdated);
    platform.addTabRemovedListener(onRemoved);
  }

  return async function watchRampsCheckoutTab({
    url,
    providerCode,
    walletAddress,
    orderCode,
    checkoutSessionId,
    region,
    providerName,
  }: WatchRampsCheckoutTabParams): Promise<void> {
    const openedTab = await platform.openTab({ url });
    if (openedTab.id === undefined) {
      throw new Error('Failed to open ramps checkout tab');
    }

    // Stamp checkoutOpenedAt *after* the tab opens so duration metrics
    // (time_since_open_ms, time_on_screen_ms) measure time on the provider
    // checkout page, not tab-open latency.
    const checkoutOpenedAt = Date.now();

    const analyticsContext: RampsCheckoutAnalyticsContext = {
      checkoutSessionId,
      checkoutOpenedAt,
      region,
      orderCode,
      providerName,
    };

    trackRampsCheckoutOpened({
      ...analyticsContext,
      checkoutUrl: url,
      // Per the schema: "whether the checkout was opened with a callback
      // redirection flow (provider code + wallet address available)" — not
      // whether the provider precreated an order. Precreated checkouts
      // redirect through the callback URL too.
      hasCallbackFlow: Boolean(providerCode && walletAddress),
    });

    startWatching({
      tabId: openedTab.id,
      providerCode,
      walletAddress,
      orderCode,
      analyticsContext,
    });
  };
}
