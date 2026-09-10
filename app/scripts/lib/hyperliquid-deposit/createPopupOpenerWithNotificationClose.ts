import type { Browser } from 'webextension-polyfill';
import type NotificationManager from "../notification-manager";
import type { AppStateController } from '../../controllers/app-state-controller';
import { createPopupOpener } from '../../popup/background';

export type CreatePopupOpenerWithNotificationCloseDeps = {
  appStateController: Pick<AppStateController, 'getCurrentPopupId'>;
  extension: Pick<Browser, 'tabs' | 'windows'>;
  notificationManager: Pick<NotificationManager, 'markAsAutomaticallyClosed'>;
};

/**
 * Creates a popup opener that closes the notification window on success.
 * This is specific to the Hyperliquid deposit flow where we want to switch
 * from the notification window to the popup for the deposit confirmation.
 *
 * @param deps - Required controller/extension dependencies.
 * @returns A function that opens the popup and closes notification on success.
 */
export function createPopupOpenerWithNotificationClose(
  deps: CreatePopupOpenerWithNotificationCloseDeps,
) {
  const popupOpener = createPopupOpener({ extension: deps.extension });

  return async (tabId: number): Promise<boolean> => {
    const opened = await popupOpener({ tabId });

    if (opened) {
      const notificationWindowId = deps.appStateController.getCurrentPopupId();
      if (notificationWindowId) {
        deps.notificationManager.markAsAutomaticallyClosed();
        await deps.extension.windows.remove(notificationWindowId).catch(() => {
          // Window may already be closed
        });
      }
    }

    return opened;
  };
}
