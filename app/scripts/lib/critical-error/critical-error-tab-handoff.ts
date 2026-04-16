import browser from 'webextension-polyfill';
import log from 'loglevel';
import { captureException } from '../../../../shared/lib/sentry';
import {
  CRITICAL_ERROR_RESTORE_KEY,
  METAMASK_RESTORING_PAGE_URL,
} from '../../../../shared/constants/critical-error-restore-session';

export type RestoringTabHandoff = {
  tabId: number | undefined;
  tabUrl: string;
};

export type ExtensionPlatformLike = {
  getExtensionURL: (
    route?: string | null,
    queryString?: string | null,
  ) => string;
};

export async function readCriticalErrorRestoreSession(
  browserApi: typeof browser,
): Promise<RestoringTabHandoff | null> {
  try {
    // storage.local survives runtime.reload(); storage.session does not
    const data = await browserApi.storage.local.get(CRITICAL_ERROR_RESTORE_KEY);
    const session = data[CRITICAL_ERROR_RESTORE_KEY];

    if (!session || typeof session !== 'object') {
      return null;
    }

    const { tabUrl, tabId } = session as Record<string, unknown>;
    if (typeof tabUrl !== 'string') {
      return null;
    }

    return {
      tabId: typeof tabId === 'number' ? tabId : undefined,
      tabUrl,
    };
  } catch (error) {
    // Do not rethrow: throwing would block the service worker initialization, and this,
    // even when the startup is a default init (not a critical-error restore).
    // Returning null treats the error like absent session data and at least allows
    // default init to proceed.
    captureException(error);
    return null;
  }
}

/**
 * Removes the restore session key. Best-effort: if `storage.local.remove` fails,
 * the error is wrapped for context, reported to Sentry, and not rethrown so startup
 * can continue (the key may already be absent or storage may be transiently broken).
 *
 * @param browserApi - WebExtension `browser` API (injected for tests).
 */
export async function clearCriticalErrorRestoreSession(
  browserApi: typeof browser,
): Promise<void> {
  try {
    await browserApi.storage.local.remove(CRITICAL_ERROR_RESTORE_KEY);
  } catch (error) {
    // Do not rethrow: throwing would block the critical-error restore path and could
    // keep the user from reaching their SRP. If remove keeps failing (non-transient),
    // the session key may remain and they may repeat recovery after each restart until
    // remove succeeds. We accept that trade-off so SRP remains accessible in case of storage failure.
    captureException(
      new Error(
        'critical-error-restore: failed to clear restore session from storage.local',
        { cause: error },
      ),
    );
  }
}

export async function openRestoringTabAndReload(
  requestSafeReload: () => Promise<void>,
): Promise<void> {
  const fragment = crypto.randomUUID();
  const url = `${METAMASK_RESTORING_PAGE_URL}#${fragment}`;

  const value: { tabUrl: string; tabId?: number } = { tabUrl: url };
  try {
    // Open a new tab before reloading: reloading MetaMask can cause the browser to
    // shut down if MetaMask is the only open tab.
    const { id } = await browser.tabs.create({ url, active: true });

    // Defensive check since ID is optional. Based on documentation, a tab may not
    // be assigned an ID under some circumstances:
    // - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
    // - https://developer.chrome.com/docs/extensions/reference/api/tabs#type-Tab
    if (typeof id === 'number') {
      value.tabId = id;
    }
  } catch (error) {
    // Tab creation should rarely fail. If it does, we still persist session and reload.
    // Without tabId, handoff may be limited. Reloading alone may close the browser if
    // MetaMask was the only tab.
    log.error(error);
  }

  await browser.storage.local.set({ [CRITICAL_ERROR_RESTORE_KEY]: value });

  await requestSafeReload();
}

/**
 * Opens the extension home UI in a new tab.
 * Used when we cannot reuse the restoring tab (missing id, tab closed, URL drift,
 * or `tabs.update` failure).
 * @param platform
 */
async function openExtensionUiInNewTab(
  platform: ExtensionPlatformLike,
): Promise<void> {
  try {
    const url = platform.getExtensionURL();
    await browser.tabs.create({ url, active: true });
  } catch (error) {
    log.error(
      'critical-error-restore: failed to open extension UI in a new tab',
      error,
    );
  }
}

/**
 * Attempts `tabs.update` on the dedicated restoring tab so it becomes the extension UI.
 *
 * @param platform - Extension platform used to resolve the home / full UI URL.
 * @param handoff - Persisted restoring-tab session (id + expected tab URL).
 * @returns `true` when the in-place update succeeded.
 */
async function tryHandoffViaRestoringTab(
  platform: ExtensionPlatformLike,
  handoff: RestoringTabHandoff,
): Promise<boolean> {
  if (typeof handoff.tabId !== 'number') {
    log.warn(
      'critical-error-restore: missing restoring tab id; opening extension UI in a new tab',
    );
    return false;
  }

  const expected = new URL(handoff.tabUrl);

  let tab: browser.Tabs.Tab | undefined;
  try {
    tab = await browser.tabs.get(handoff.tabId);
  } catch (error) {
    log.warn('critical-error-restore: restoring tab is gone', error);
    return false;
  }

  if (!tab.url) {
    log.warn('critical-error-restore: restoring tab has no URL');
    return false;
  }

  const actual = new URL(tab.url);
  // metamask.io may redirect to a locale-prefixed path (e.g. /en-GB/restoring)
  if (
    actual.origin !== expected.origin ||
    !actual.pathname.endsWith('/restoring') ||
    actual.hash !== expected.hash
  ) {
    log.warn(
      `critical-error-restore: restoring tab URL diverged — expected ${handoff.tabUrl}, got ${tab.url}`,
    );
    return false;
  }

  try {
    await browser.tabs.update(handoff.tabId, {
      active: true,
      url: platform.getExtensionURL(),
    });
    return true;
  } catch (error) {
    log.warn(
      'critical-error-restore: failed to update restoring tab; opening extension UI in a new tab',
      error,
    );
    return false;
  }
}

/**
 * Prefer navigating the dedicated restoring tab to the extension UI. If that is not
 * possible, opens the extension UI in a new tab so restore can still continue.
 * @param platform
 * @param handoff
 */
export async function handoffRestoringTabToExtension(
  platform: ExtensionPlatformLike,
  handoff: RestoringTabHandoff,
): Promise<void> {
  const handedOffInPlace = await tryHandoffViaRestoringTab(platform, handoff);
  if (!handedOffInPlace) {
    await openExtensionUiInNewTab(platform);
  }
}
