import browser from 'webextension-polyfill';
import { v4 as uuidv4 } from 'uuid';
import {
  CRITICAL_ERROR_RESTORE_PENDING,
  CRITICAL_ERROR_RESTORE_TAB_ID,
  CRITICAL_ERROR_RESTORE_TAB_URL,
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
  const data = await browserApi.storage.local.get([
    CRITICAL_ERROR_RESTORE_PENDING,
    CRITICAL_ERROR_RESTORE_TAB_ID,
    CRITICAL_ERROR_RESTORE_TAB_URL,
  ]);

  if (!data[CRITICAL_ERROR_RESTORE_PENDING]) {
    return null;
  }

  const tabUrl = data[CRITICAL_ERROR_RESTORE_TAB_URL];
  if (typeof tabUrl !== 'string') {
    return null;
  }

  const tabIdRaw = data[CRITICAL_ERROR_RESTORE_TAB_ID];
  const tabId = typeof tabIdRaw === 'number' ? tabIdRaw : undefined;

  return {
    tabId,
    tabUrl,
  };
}

export async function clearPendingCriticalErrorRestore(
  browserApi: typeof browser,
): Promise<void> {
  await browserApi.storage.local.remove([
    CRITICAL_ERROR_RESTORE_PENDING,
    CRITICAL_ERROR_RESTORE_TAB_ID,
    CRITICAL_ERROR_RESTORE_TAB_URL,
  ]);
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
    console.error(error);
  }

  await browser.storage.local.set({
    [CRITICAL_ERROR_RESTORE_PENDING]: true,
    [CRITICAL_ERROR_RESTORE_TAB_URL]: url,
    ...(typeof tabId === 'number'
      ? { [CRITICAL_ERROR_RESTORE_TAB_ID]: tabId }
      : {}),
  });

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
    return;
  }

  const expected = new URL(handoff.tabUrl);

  try {
    const tab = await browser.tabs.get(handoff.tabId);
    if (!tab.url) {
      return;
    }
    const actual = new URL(tab.url);
    // metamask.io may redirect to a locale-prefixed path (e.g. /en-GB/restoring)
    if (
      actual.origin !== expected.origin ||
      !actual.pathname.endsWith('/restoring') ||
      actual.hash !== expected.hash
    ) {
      return;
    }

    await browser.tabs.update(handoff.tabId, {
      active: true,
      url: platform.getExtensionURL(),
    });
  } catch {
    // ignore
  }
}
