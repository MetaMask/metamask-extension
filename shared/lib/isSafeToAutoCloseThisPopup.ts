import browser from 'webextension-polyfill';
/**
 * Determines if it's safe to automatically close the current window.
 *
 * This function checks if the current window is a popup. The function follows
 * a "safe by default" approach - it only prevents auto-closing when it can
 * definitively confirm that the window is not a popup (to avoid closing
 * extension UIs running in tabs).
 *
 * @returns A Promise that resolves to `true` if the window is a popup
 * or if the window type cannot be determined – and `false` only if the
 * window is confirmed to not be a popup.
 */
export const isSafeToAutoCloseThisPopup = async (): Promise<boolean> => {
  try {
    const currentWindow = await browser.windows.getCurrent();
    // Only return false if we know for sure it's not a popup
    if (currentWindow?.type && currentWindow.type !== 'popup') {
      console.warn('Not safe to close a window likely running in a tab.');
      return false;
    }
    // In all other cases (no window found, error, or is popup), consider it safe
    return true;
  } catch (error) {
    console.error('Error getting current window:', error);
    return true; // Default to safe in case of errors
  }
};
