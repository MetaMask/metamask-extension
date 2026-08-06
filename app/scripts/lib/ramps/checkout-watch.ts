import {
  getInternalOrderCode,
  RampsOrderStatus,
  type RampsController,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { getRampCallbackBaseUrl } from '../../../../shared/lib/ramps/callback-url';
import type ExtensionPlatform from '../../platforms/extension';
import {
  trackRampsTerminalOrder,
  trackRampsTransactionConfirmed,
} from './handleRampsOrderStatusChanged';
import {
  trackRampsCheckoutCallbackDetected,
  trackRampsCheckoutClosed,
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
   * Internal order code for the precreated stub, when one exists. Used to
   * optimistically mark the order in-progress on redirect (snappy pending
   * toast) and to retire the stub once the provider's real order id arrives.
   * Also used as a fallback lookup if resolving from the callback URL fails.
   */
  orderCode?: string;
  checkoutSessionId: string;
  checkoutOpenedAt: number;
  region?: string;
};

type ActiveWatch = {
  cleanup: () => void;
};

/**
 * Background watcher for provider checkout tabs navigating to the ramps
 * callback URL.
 *
 * Opens the checkout tab in the background (so popup-mode UI can close safely),
 * then watches for navigation to the ramps callback URL.
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
    checkoutSessionId,
    checkoutOpenedAt,
    region,
  }: {
    tabId: number;
    providerCode: string;
    walletAddress: string;
    orderCode?: string;
    checkoutSessionId: string;
    checkoutOpenedAt: number;
    region?: string;
  }): void {
    // Defensive: the flow watches each freshly-opened tab exactly once, so a
    // repeat tab id should never occur. If it ever does, the old session is
    // silently superseded — deliberately NOT emitted as `checkout-closed`,
    // since displacement is not a user close and the schema has no
    // displacement close source (better an edge undercount than mislabeled
    // telemetry).
    activeByTabId.get(tabId)?.cleanup();

    const analyticsContext: RampsCheckoutAnalyticsContext = {
      checkoutSessionId,
      checkoutOpenedAt,
      region,
      orderCode,
    };

    let stepIndex = 0;
    let lastCountedUrl: string | undefined;

    const cleanup = () => {
      platform.removeTabUpdatedListener(onUpdated);
      platform.removeTabRemovedListener(onRemoved);
      activeByTabId.delete(tabId);
    };

    const markPrecreatedOrderPending = (): RampsOrder | undefined => {
      if (!orderCode) {
        return undefined;
      }
      const existing = (rampsController.state?.orders ?? []).find(
        (order) => getInternalOrderCode(order) === orderCode,
      );
      if (!existing || existing.status !== RampsOrderStatus.Precreated) {
        return undefined;
      }
      // Optimistic in-progress so the UI pending toast fires the moment the
      // provider tab closes, instead of waiting on the next poll cycle.
      rampsController.addOrder({
        ...existing,
        status: RampsOrderStatus.Pending,
      });
      return existing;
    };

    const resolveOrder = async (callbackUrl: string): Promise<void> => {
      // Fire pending toast / activity update immediately on redirect.
      const precreatedOrder = markPrecreatedOrderPending();

      // Always resolve from the callback URL — even for precreated checkouts.
      // Providers like MoonPay put their native transaction id in the redirect;
      // polling the custom order id alone leaves an orphan PRECREATED stub and
      // a separate PENDING/COMPLETED row under the native id.
      try {
        const order = await rampsController.getOrderFromCallback(
          providerCode,
          callbackUrl,
          walletAddress,
        );
        const resolvedCode = getInternalOrderCode(order);
        rampsController.addOrder(order);
        // Orders resolved already-terminal here publish no
        // `orderStatusChanged` and are never polled, so the terminal KPI has
        // to be emitted from this path (deduped inside).
        trackRampsTerminalOrder(order, checkoutSessionId);
        // Non-terminal orders emit `ramps-transaction-confirmed` — the user
        // has submitted the order for processing but it hasn't completed yet.
        // Terminal orders no-op here (they emit via trackRampsTerminalOrder).
        trackRampsTransactionConfirmed(order, region, checkoutSessionId);
        if (orderCode && resolvedCode && orderCode !== resolvedCode) {
          rampsController.removeOrder(orderCode);
        }
        return;
      } catch (callbackError) {
        console.error(
          'Failed to resolve ramps order from callback',
          callbackError,
        );
        // Undo the optimistic flip. A pending stub carrying no provider data
        // is invisible to `removeStalePrecreatedOrders`, so leaving it would
        // strand it in state forever.
        if (precreatedOrder) {
          rampsController.addOrder(precreatedOrder);
          return;
        }
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
        trackRampsTerminalOrder(order, checkoutSessionId);
        trackRampsTransactionConfirmed(order, region, checkoutSessionId);
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
      tab?: { url?: string },
    ): void {
      if (updatedTabId !== tabId) {
        return;
      }

      const candidateUrl = changeInfo.url ?? changeInfo.pendingUrl ?? tab?.url;
      if (!candidateUrl) {
        return;
      }

      // `tabs.onUpdated` fires repeatedly for one page load (loading, title,
      // favicon, complete), and the status-only updates still resolve a URL via
      // `tab.url`. Count a step only when the URL actually changes, so
      // `step_index` measures checkout progress rather than event volume.
      if (candidateUrl !== lastCountedUrl) {
        lastCountedUrl = candidateUrl;
        stepIndex += 1;
      }

      if (!candidateUrl.startsWith(getRampCallbackBaseUrl())) {
        return;
      }

      trackRampsCheckoutCallbackDetected(
        analyticsContext,
        candidateUrl,
        stepIndex,
      );
      trackRampsCheckoutClosed(analyticsContext, {
        closeSource: 'callback_success',
        callbackReached: true,
        stepIndex,
      });
      finish(candidateUrl);
    }

    function onRemoved(removedTabId: number): void {
      if (removedTabId !== tabId) {
        return;
      }
      // User closed checkout without finishing — not an error, but the key
      // abandonment signal (the provider page is otherwise opaque).
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
    checkoutOpenedAt,
    region,
  }: WatchRampsCheckoutTabParams): Promise<void> {
    const openedTab = await platform.openTab({ url });
    if (openedTab.id === undefined) {
      throw new Error('Failed to open ramps checkout tab');
    }

    startWatching({
      tabId: openedTab.id,
      providerCode,
      walletAddress,
      orderCode,
      checkoutSessionId,
      checkoutOpenedAt,
      region,
    });
  };
}
