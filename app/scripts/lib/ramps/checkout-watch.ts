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

export type WatchRampsOrderTabParams = {
  /**
   * Provider order page URL (e.g. the Banxa order status page), re-opened from
   * ramp order details. Opened in the background so popup-mode UI can die
   * after dispatching this call without losing the tab watcher.
   */
  url: string;
  providerCode: string;
  walletAddress: string;
  /**
   * Provider order code. Used only as a fallback lookup if resolving from the
   * callback URL fails.
   */
  orderCode?: string;
};

type ActiveWatch = {
  cleanup: () => void;
};

type WatchTabParams = {
  tabId: number;
  providerCode: string;
  walletAddress: string;
  orderCode?: string;
  /**
   * Full checkout funnel analytics context, including the `checkoutOpenedAt`
   * timestamp stamped by the watch core after the tab opens. When omitted
   * (order re-entry watch), the checkout funnel events (`checkout-opened`,
   * `callback-detected`, `checkout-closed`) are not emitted — re-opening an
   * existing order page is not a new checkout. Order-scoped events
   * (`transaction-confirmed`, terminal KPIs) still fire, without a
   * `checkout_session_id` join key.
   */
  analyticsContext?: RampsCheckoutAnalyticsContext;
};

/**
 * Shared tab-watch core for both ramps checkout entry points.
 *
 * Watches a provider tab for navigation to the ramps callback URL. On match,
 * resolves the order (callback URL first, provider order code as fallback),
 * fires order analytics, reopens the extension UI, and closes the provider
 * tab.
 * @param platform
 * @param rampsController
 */
function createWatchRampsTab(
  platform: ExtensionPlatform,
  rampsController: RampsController,
): (params: {
  url: string;
  providerCode: string;
  walletAddress: string;
  orderCode?: string;
  analyticsContext?: Omit<RampsCheckoutAnalyticsContext, 'checkoutOpenedAt'>;
}) => Promise<void> {
  const activeByTabId = new Map<number, ActiveWatch>();

  function startWatching({
    tabId,
    providerCode,
    walletAddress,
    orderCode,
    analyticsContext,
  }: WatchTabParams): void {
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
          analyticsContext?.region,
          analyticsContext?.checkoutSessionId,
        );
        if (analyticsContext) {
          trackRampsTerminalOrder(order, analyticsContext.checkoutSessionId);
        }
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
          analyticsContext?.region,
          analyticsContext?.checkoutSessionId,
        );
        if (analyticsContext) {
          trackRampsTerminalOrder(order, analyticsContext.checkoutSessionId);
        }
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

      if (analyticsContext) {
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
      }
      finish(navigationUrl);
    }

    function onRemoved(removedTabId: number): void {
      if (removedTabId !== tabId) {
        return;
      }
      if (analyticsContext) {
        trackRampsCheckoutClosed(analyticsContext, {
          closeSource: 'user_close_button',
          callbackReached: false,
          stepIndex,
        });
      }
      cleanup();
    }

    activeByTabId.set(tabId, { cleanup });
    platform.addTabUpdatedListener(onUpdated);
    platform.addTabRemovedListener(onRemoved);
  }

  return async function watchRampsTab({
    url,
    providerCode,
    walletAddress,
    orderCode,
    analyticsContext,
  }) {
    const openedTab = await platform.openTab({ url });
    if (openedTab.id === undefined) {
      throw new Error('Failed to open ramps checkout tab');
    }

    // Stamp checkoutOpenedAt *after* the tab opens so duration metrics
    // (time_since_open_ms, time_on_screen_ms) measure time on the provider
    // checkout page, not tab-open latency.
    const context = analyticsContext && {
      ...analyticsContext,
      checkoutOpenedAt: Date.now(),
    };

    if (context) {
      trackRampsCheckoutOpened({
        ...context,
        checkoutUrl: url,
        // Per the schema: "whether the checkout was opened with a callback
        // redirection flow (provider code + wallet address available)" — not
        // whether the provider precreated an order. Precreated checkouts
        // redirect through the callback URL too.
        hasCallbackFlow: Boolean(providerCode && walletAddress),
      });
    }

    startWatching({
      tabId: openedTab.id,
      providerCode,
      walletAddress,
      orderCode,
      analyticsContext: context,
    });
  };
}

/**
 * Background watcher for a provider checkout tab opened by the buy flow.
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
  const watchRampsTab = createWatchRampsTab(platform, rampsController);

  return async function watchRampsCheckoutTab({
    url,
    providerCode,
    walletAddress,
    orderCode,
    checkoutSessionId,
    region,
    providerName,
  }: WatchRampsCheckoutTabParams): Promise<void> {
    return watchRampsTab({
      url,
      providerCode,
      walletAddress,
      orderCode,
      analyticsContext: {
        checkoutSessionId,
        region,
        orderCode,
        providerName,
      },
    });
  };
}

/**
 * Background watcher for a provider order page re-opened from ramp order
 * details ("View on <provider>").
 *
 * Providers put a "Return to MetaMask" button on that page which redirects to
 * the ramps callback URL — a deliberately blank placeholder. Without a
 * watcher, the user is stranded on the blank page (TRAM-3995). This opens the
 * order page and watches for that callback so the user is returned to the
 * extension UI and the order is refreshed from the provider.
 *
 * Emits no checkout funnel events — re-opening an existing order page is not
 * a new checkout. Order resolution and order-scoped analytics
 * (`transaction-confirmed`, terminal KPIs) still fire.
 *
 * @param platform - Extension platform (tab listeners / closeTab).
 * @param rampsController - Controller used to resolve the order from the
 * callback URL.
 * @returns A `watchRampsOrderTab` function suitable for the background API.
 */
export function createWatchRampsOrderTab(
  platform: ExtensionPlatform,
  rampsController: RampsController,
): (params: WatchRampsOrderTabParams) => Promise<void> {
  const watchRampsTab = createWatchRampsTab(platform, rampsController);

  return function watchRampsOrderTab({
    url,
    providerCode,
    walletAddress,
    orderCode,
  }: WatchRampsOrderTabParams): Promise<void> {
    return watchRampsTab({
      url,
      providerCode,
      walletAddress,
      orderCode,
    });
  };
}
