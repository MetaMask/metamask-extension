import browser from 'webextension-polyfill';

import { requestSafeReload } from '../../store/actions';

/**
 * Reloads the extension from any UI surface (popup, notification, sidepanel, full tab).
 *
 * Prefer this over calling `browser.runtime.reload()` directly from UI pages.
 * `requestSafeReload` schedules reload after a short delay; we then close this
 * window so Chromium does not reparent it to normal tab content (issue #29151).
 */
export async function reloadExtensionFromUi(): Promise<void> {
  try {
    await requestSafeReload();
    window.close();
  } catch {
    browser.runtime.reload();
  }
}
