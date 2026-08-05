import {
  getInternalOrderCode,
  RampsOrderStatus,
  type RampsController,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { getRampCallbackBaseUrl } from '../../../shared/lib/ramps/callback-url';
import type ExtensionPlatform from '../platforms/extension';

export type WatchRampsCheckoutTabParams = {
  tabId: number;
  providerCode: string;
  walletAddress: string;
  /**
   * True when Continue already seeded a precreated order.
   */
  orderAlreadyPrecreated: boolean;
  /**
   * Internal order code for the precreated stub, when one exists. Used to
   * optimistically mark the order in-progress on redirect (snappy pending
   * toast) and to retire the stub once the provider's real order id arrives.
   */
  orderCode?: string;
};

type ActiveWatch = {
  cleanup: () => void;
};

/**
 * Watches a provider checkout tab for navigation to the ramps fake-callback
 * URL. Lives in the background so it survives popup unload when the user
 * leaves the extension to finish checkout.
 *
 * @param platform - Extension platform (tab listeners / closeTab).
 * @param rampsController - Controller used to resolve redirect-only orders.
 * @returns A `watchRampsCheckoutTab` function suitable for the background API.
 */
export function createWatchRampsCheckoutTab(
  platform: ExtensionPlatform,
  rampsController: RampsController,
): (params: WatchRampsCheckoutTabParams) => void {
  const activeByTabId = new Map<number, ActiveWatch>();

  return function watchRampsCheckoutTab({
    tabId,
    providerCode,
    walletAddress,
    orderCode,
  }: WatchRampsCheckoutTabParams): void {
    activeByTabId.get(tabId)?.cleanup();

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

    const finish = (callbackUrl?: string) => {
      cleanup();
      platform.closeTab(tabId).catch(() => undefined);

      if (!callbackUrl) {
        return;
      }

      // Fire pending toast / activity update immediately on redirect.
      const precreatedOrder = markPrecreatedOrderPending();

      // Always resolve from the callback URL — even for precreated checkouts.
      // Providers like MoonPay put their native transaction id in the redirect;
      // polling the custom order id alone leaves an orphan PRECREATED stub and
      // a separate PENDING/COMPLETED row under the native id.
      rampsController
        .getOrderFromCallback(providerCode, callbackUrl, walletAddress)
        .then((order) => {
          const resolvedCode = getInternalOrderCode(order);
          rampsController.addOrder(order);
          if (orderCode && resolvedCode && orderCode !== resolvedCode) {
            rampsController.removeOrder(orderCode);
          }
        })
        .catch((error) => {
          console.error('Failed to resolve ramps order from callback', error);
          // Undo the optimistic flip. A pending stub carrying no provider data
          // is invisible to `removeStalePrecreatedOrders`, so leaving it would
          // strand it in state forever.
          if (precreatedOrder) {
            rampsController.addOrder(precreatedOrder);
          }
        });
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
      if (!candidateUrl?.startsWith(getRampCallbackBaseUrl())) {
        return;
      }

      finish(candidateUrl);
    }

    function onRemoved(removedTabId: number): void {
      if (removedTabId !== tabId) {
        return;
      }
      // User closed checkout without finishing — not an error.
      cleanup();
    }

    activeByTabId.set(tabId, { cleanup });
    platform.addTabUpdatedListener(onUpdated);
    platform.addTabRemovedListener(onRemoved);
  };
}
