import type { Browser } from 'webextension-polyfill';

export type PopupOpenerDeps = {
  extension: Pick<Browser, 'tabs' | 'windows'>;
};

/**
 * Creates a popup opener function.
 *
 * Similar to `createSidepanelOpener`, this provides a standardized way to
 * open the MetaMask popup, optionally in a specific tab's window.
 *
 * @param deps - Required extension dependencies.
 * @returns A function that opens the popup.
 */
export function createPopupOpener(deps: PopupOpenerDeps) {
  /**
   * Opens the MetaMask popup.
   *
   * @param tabId - If provided, opens popup in this tab's window.
   * @returns True if popup opened successfully, false otherwise.
   */
  return async function requestOpenPopup(tabId?: number): Promise<boolean> {
    if (!globalThis.chrome?.action?.openPopup) {
      return false;
    }

    try {
      // Determine target window from tabId
      let windowId: number | undefined;
      if (tabId) {
        const tab = await deps.extension.tabs.get(tabId).catch(() => undefined);
        windowId = tab?.windowId;
      }

      // Focus the target window if specified
      if (windowId) {
        await deps.extension.windows.update(windowId, { focused: true });
      }

      await globalThis.chrome.action.openPopup(
        windowId ? { windowId } : undefined,
      );
      return true;
    } catch {
      return false;
    }
  };
}
