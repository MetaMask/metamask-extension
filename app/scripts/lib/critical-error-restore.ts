import browser from 'webextension-polyfill';
import { v4 as uuidv4 } from 'uuid';
import log from 'loglevel';
import {
  CRITICAL_ERROR_RESTORE_KEY,
  METAMASK_RESTORING_PAGE_URL,
} from '../../../shared/constants/critical-error-restore-session';

export type PendingCriticalErrorRestore = {
  tabId: number | undefined;
  tabUrl: string;
};

export async function readPendingCriticalErrorRestore(
  browserApi: typeof browser,
): Promise<PendingCriticalErrorRestore | null> {
  // storage.local survives runtime.reload(); storage.session does not
  const data = await browserApi.storage.local.get(CRITICAL_ERROR_RESTORE_KEY);
  const pending = data[CRITICAL_ERROR_RESTORE_KEY];

  if (!pending || typeof pending !== 'object') {
    return null;
  }

  const { tabUrl, tabId } = pending as Record<string, unknown>;
  if (typeof tabUrl !== 'string') {
    return null;
  }

  return {
    tabId: typeof tabId === 'number' ? tabId : undefined,
    tabUrl,
  };
}

export async function clearPendingCriticalErrorRestore(
  browserApi: typeof browser,
): Promise<void> {
  await browserApi.storage.local.remove(CRITICAL_ERROR_RESTORE_KEY);
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
