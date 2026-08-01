import type { RampsController } from '@metamask/ramps-controller';
import { getRampCallbackBaseUrl } from '../../../../shared/lib/ramps/callback-url';
import type ExtensionPlatform from '../../platforms/extension';

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
  }: {
    tabId: number;
    providerCode: string;
    walletAddress: string;
    orderCode?: string;
  }): void {
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
  }

  return async function watchRampsCheckoutTab({
    url,
    providerCode,
    walletAddress,
    orderCode,
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
    });
  };
}
