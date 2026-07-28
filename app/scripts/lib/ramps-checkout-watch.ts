import type { RampsController } from '@metamask/ramps-controller';
import { getRampCallbackBaseUrl } from '../../../shared/lib/ramps/callback-url';
import type ExtensionPlatform from '../platforms/extension';

export type WatchRampsCheckoutTabParams = {
  tabId: number;
  providerCode: string;
  walletAddress: string;
  /**
   * True when Continue already seeded a precreated order. The watcher then
   * only closes the callback tab — polling owns status updates.
   */
  orderAlreadyPrecreated: boolean;
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
    orderAlreadyPrecreated,
  }: WatchRampsCheckoutTabParams): void {
    activeByTabId.get(tabId)?.cleanup();

    const cleanup = () => {
      platform.removeTabUpdatedListener(onUpdated);
      platform.removeTabRemovedListener(onRemoved);
      activeByTabId.delete(tabId);
    };

    const finish = (callbackUrl?: string) => {
      cleanup();
      platform.closeTab(tabId).catch(() => undefined);

      if (orderAlreadyPrecreated || !callbackUrl) {
        return;
      }

      rampsController
        .getOrderFromCallback(providerCode, callbackUrl, walletAddress)
        .then((order) => {
          rampsController.addOrder(order);
        })
        .catch((error) => {
          console.error('Failed to resolve ramps order from callback', error);
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
