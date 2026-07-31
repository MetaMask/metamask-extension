import {
  getInternalOrderCode,
  RampsOrderStatus,
  type RampsController,
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
   * Precreated stub code, when one exists (pending flip + retire).
   */
  orderCode?: string;
};

type ActiveWatch = {
  cleanup: () => void;
};

/**
 * Background watcher for provider checkout tabs navigating to the ramps
 * callback URL.
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

    const markPrecreatedOrderPending = (): void => {
      if (!orderCode) {
        return;
      }
      const existing = (rampsController.state?.orders ?? []).find(
        (order) => getInternalOrderCode(order) === orderCode,
      );
      if (!existing || existing.status !== RampsOrderStatus.Precreated) {
        return;
      }
      // Flip PRECREATED → PENDING immediately for the UI toast.
      rampsController.addOrder({
        ...existing,
        status: RampsOrderStatus.Pending,
      });
    };

    /**
     * Removes the stub when the resolved order uses a different code.
     *
     * @param resolvedCode - Internal code of the resolved order.
     */
    const retireStub = (resolvedCode?: string): void => {
      if (orderCode && resolvedCode && orderCode !== resolvedCode) {
        rampsController.removeOrder(orderCode);
      }
    };

    const resolveOrder = async (callbackUrl: string): Promise<void> => {
      // Always resolve via callback URL (provider id may differ from the stub).
      try {
        const order = await rampsController.getOrderFromCallback(
          providerCode,
          callbackUrl,
          walletAddress,
        );
        rampsController.addOrder(order);
        retireStub(getInternalOrderCode(order));
        return;
      } catch (callbackError) {
        console.error(
          'Failed to resolve ramps order from callback',
          callbackError,
        );
      }

      // Fallback: resolve by stub code if the callback request fails.
      if (!orderCode) {
        return;
      }

      try {
        const order = await rampsController.getOrder(
          providerCode,
          orderCode,
          walletAddress,
        );
        retireStub(getInternalOrderCode(order));
      } catch (error) {
        // Keep PENDING on failure; do not revert to PRECREATED.
        console.error('Failed to resolve ramps order by code', error);
      }
    };

    const finish = (callbackUrl?: string) => {
      cleanup();
      platform.closeTab(tabId).catch(() => undefined);

      if (!callbackUrl) {
        return;
      }

      markPrecreatedOrderPending();
      resolveOrder(callbackUrl).catch(() => undefined);
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
