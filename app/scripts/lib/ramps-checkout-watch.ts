import type { RampsController } from '@metamask/ramps-controller';
import { getRampCallbackBaseUrl } from '../../../shared/lib/ramps/callback-url';
import type ExtensionPlatform from '../platforms/extension';

export type WatchRampsCheckoutTabParams = {
  tabId: number;
  providerCode: string;
  walletAddress: string;
  /**
   * Widget order id, when the provider returned one. Used only as a fallback
   * lookup if resolving from the callback URL fails.
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

    const resolveOrder = async (callbackUrl: string): Promise<void> => {
      try {
        const order = await rampsController.getOrderFromCallback(
          providerCode,
          callbackUrl,
          walletAddress,
        );
        rampsController.addOrder(order);
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
      } catch (error) {
        console.error('Failed to resolve ramps order by code', error);
      }
    };

    const finish = (callbackUrl?: string) => {
      cleanup();
      platform.closeTab(tabId).catch(() => undefined);

      if (!callbackUrl) {
        return;
      }

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
      cleanup();
    }

    activeByTabId.set(tabId, { cleanup });
    platform.addTabUpdatedListener(onUpdated);
    platform.addTabRemovedListener(onRemoved);
  };
}
