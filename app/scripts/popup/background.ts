import type { Browser } from 'webextension-polyfill';
import type NotificationManager from '../lib/notification-manager';
import type { AppStateController } from '../controllers/app-state-controller';

export type PopupOpenerDeps = {
  appStateController: Pick<AppStateController, 'getCurrentPopupId'>;
  extension: Pick<Browser, 'tabs' | 'windows'>;
  notificationManager: Pick<NotificationManager, 'markAsAutomaticallyClosed'>;
};

/**
 * Creates a popup opener function.
 *
 * Similar to `createSidepanelOpener`, this provides a standardized way to
 * open the MetaMask popup, optionally in a specific tab's window.
 *
 * @param deps - Required controller/extension dependencies.
 * @returns A function that opens the popup.
 */
export function createPopupOpener(deps: PopupOpenerDeps) {
  /**
   * Opens the MetaMask popup, closing any existing notification window first.
   *
   * @param options - Optional parameters.
   * @param options.tabId - If provided, opens popup in this tab's window.
   * @returns True if popup opened successfully, false otherwise.
   */
  return async function requestOpenPopup(options?: {
    tabId?: number;
  }): Promise<boolean> {
    if (!globalThis.chrome?.action?.openPopup) {
      return false;
    }

    try {
      // Close any existing notification window first.
      // This prevents the notification from showing the same approval.
      const notificationWindowId = deps.appStateController.getCurrentPopupId();
      if (notificationWindowId) {
        deps.notificationManager.markAsAutomaticallyClosed();
        await deps.extension.windows.remove(notificationWindowId).catch(() => {
          // Window may already be closed
        });
      }

      // Determine target window
      let windowId: number | undefined;
      if (options?.tabId) {
        const tab = await deps.extension.tabs
          .get(options.tabId)
          .catch(() => undefined);
        windowId = tab?.windowId;
      }

      // Focus the target window if specified
      if (windowId) {
        await deps.extension.windows.update(windowId, { focused: true });
      }

      // Open popup
      await globalThis.chrome.action.openPopup(
        windowId ? { windowId } : undefined,
      );
      return true;
    } catch {
      return false;
    }
  };
}
