import browser from 'webextension-polyfill';
import { v4 as uuidv4 } from 'uuid';
import log from 'loglevel';
import { captureException } from '../../../../shared/lib/sentry';
import {
  CRITICAL_ERROR_RESTORE_KEY,
  METAMASK_RESTORING_PAGE_URL,
} from '../../../../shared/constants/critical-error-restore-session';

export type CriticalErrorRestoreSession = {
  tabId: number | undefined;
  tabUrl: string;
};

export async function readCriticalErrorRestoreSession(
  browserApi: typeof browser,
): Promise<CriticalErrorRestoreSession | null> {
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
  const fragment = uuidv4();
  const url = `${METAMASK_RESTORING_PAGE_URL}#${fragment}`;

  let tabId: number | undefined;
  try {
    const tab = await browser.tabs.create({ url, active: true });
    tabId = tab.id;
  } catch (error) {
    log.error(error);
  }

  const value: Record<string, unknown> = { tabUrl: url };
  if (typeof tabId === 'number') {
    value.tabId = tabId;
  }
  await browser.storage.local.set({ [CRITICAL_ERROR_RESTORE_KEY]: value });

  await requestSafeReload();
}

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

export async function handoffRestoringTabToExtension(
  platform: ExtensionPlatformLike,
  handoff: RestoringTabHandoff,
): Promise<void> {
  if (handoff.tabId === undefined) {
    log.warn('critical-error-restore: cannot hand off — tab id is undefined');
    return;
  }

  const expected = new URL(handoff.tabUrl);

  let tab: browser.Tabs.Tab;
  try {
    tab = await browser.tabs.get(handoff.tabId);
  } catch (error) {
    log.warn('critical-error-restore: restoring tab is gone', error);
    return;
  }

  if (!tab.url) {
    log.warn('critical-error-restore: restoring tab has no URL');
    return;
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
    return;
  }

  await browser.tabs.update(handoff.tabId, {
    active: true,
    url: platform.getExtensionURL(),
  });
}
