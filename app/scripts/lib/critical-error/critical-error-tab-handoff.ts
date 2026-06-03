import browser from 'webextension-polyfill';
import log from 'loglevel';
import { captureException } from '../../../../shared/lib/sentry';
import {
  CRITICAL_ERROR_RESTORE_KEY,
  METAMASK_RESTORING_PAGE_URL,
} from '../../../../shared/constants/critical-error-restore-session';

export const CriticalErrorRestoreValueKeyPrefix =
  '__metamaskCriticalErrorRestore:';
export const CriticalErrorRestorePointerKeyPrefix =
  '__metamaskCriticalErrorRestorePointer';
export const CriticalErrorRestoreSecondaryPointerKeyPrefix =
  '__metamaskCriticalErrorRestoreSecondaryPointer';

const CriticalErrorRestorePrimaryPointerKeys = [
  `${CriticalErrorRestorePointerKeyPrefix}0`,
  `${CriticalErrorRestorePointerKeyPrefix}1`,
  `${CriticalErrorRestorePointerKeyPrefix}2`,
  `${CriticalErrorRestorePointerKeyPrefix}3`,
] as const;
const CriticalErrorRestoreSecondaryPointerKeys = [
  `${CriticalErrorRestoreSecondaryPointerKeyPrefix}0`,
  `${CriticalErrorRestoreSecondaryPointerKeyPrefix}1`,
  `${CriticalErrorRestoreSecondaryPointerKeyPrefix}2`,
  `${CriticalErrorRestoreSecondaryPointerKeyPrefix}3`,
] as const;
const CriticalErrorRestorePointerKeys = [
  ...CriticalErrorRestorePrimaryPointerKeys,
  ...CriticalErrorRestoreSecondaryPointerKeys,
] as const;
const CRITICAL_ERROR_RESTORE_POINTER_VERSION = 1;

export type RestoringTabHandoff = {
  tabId: number | undefined;
  tabUrl: string;
};

type StoredRestoringTabHandoff = {
  tabId?: number;
  tabUrl: string;
};

type CriticalErrorRestorePointer = {
  version: typeof CRITICAL_ERROR_RESTORE_POINTER_VERSION;
  updatedAt: number;
  storageKey: string | null;
};

type CriticalErrorRestorePointerState = {
  pointer?: CriticalErrorRestorePointer;
  hasUnreadablePointers: boolean;
};

type CriticalErrorRestoreStorageOperation = 'read' | 'write';

type CriticalErrorRestoreStorageKeyClass =
  | 'critical-error-restore-legacy-state'
  | 'critical-error-restore-generated-state'
  | 'critical-error-restore-pointer';

let criticalErrorRestoreWriteQueue: Promise<void> = Promise.resolve();

export type ExtensionPlatformLike = {
  getExtensionURL: (
    route?: string | null,
    queryString?: string | null,
  ) => string;
};

function makeStorageKeyId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function makeCriticalErrorRestoreValueKey(): string {
  return `${CriticalErrorRestoreValueKeyPrefix}${makeStorageKeyId()}`;
}

async function runCriticalErrorRestoreWrite<Result>(
  operation: () => Promise<Result>,
): Promise<Result> {
  const previousQueue = criticalErrorRestoreWriteQueue;
  let releaseCurrentQueue: () => void = () => undefined;
  const currentQueue = new Promise<void>((resolve) => {
    releaseCurrentQueue = resolve;
  });
  const nextQueue = previousQueue
    .catch(() => undefined)
    .then(() => currentQueue);
  criticalErrorRestoreWriteQueue = nextQueue;

  await previousQueue.catch(() => undefined);
  try {
    return await operation();
  } finally {
    releaseCurrentQueue();
    if (criticalErrorRestoreWriteQueue === nextQueue) {
      criticalErrorRestoreWriteQueue = Promise.resolve();
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCriticalErrorRestorePointer(
  value: unknown,
): value is CriticalErrorRestorePointer {
  return (
    isObject(value) &&
    value.version === CRITICAL_ERROR_RESTORE_POINTER_VERSION &&
    typeof value.updatedAt === 'number' &&
    (typeof value.storageKey === 'string' || value.storageKey === null)
  );
}

function normalizeRestoreSession(session: unknown): RestoringTabHandoff | null {
  if (!isObject(session)) {
    return null;
  }

  const { tabUrl, tabId } = session;
  if (typeof tabUrl !== 'string') {
    return null;
  }

  return {
    tabId: typeof tabId === 'number' ? tabId : undefined,
    tabUrl,
  };
}

async function readStorageKey(
  browserApi: typeof browser,
  storageKey: string,
): Promise<unknown> {
  const data = await browserApi.storage.local.get(storageKey);
  return data[storageKey];
}

function captureCriticalErrorRestoreStorageError(
  message: string,
  error: unknown,
  storageOperation: CriticalErrorRestoreStorageOperation,
  storageKeyClass: CriticalErrorRestoreStorageKeyClass,
) {
  captureException(new Error(message, { cause: error }), {
    tags: {
      'persistence.storage_area': 'local',
      'persistence.storage_operation': storageOperation,
      'persistence.storage_key_class': storageKeyClass,
    },
  });
}

async function readLatestRestorePointer(
  browserApi: typeof browser,
): Promise<CriticalErrorRestorePointerState> {
  let hasUnreadablePointers = false;
  const pointers = (
    await Promise.all(
      CriticalErrorRestorePointerKeys.map(async (pointerKey) => {
        try {
          const response = await browserApi.storage.local.get(pointerKey);
          if (isCriticalErrorRestorePointer(response[pointerKey])) {
            return response[pointerKey];
          }
        } catch (error) {
          hasUnreadablePointers = true;
          captureCriticalErrorRestoreStorageError(
            'critical-error-restore: failed to read restore session pointer',
            error,
            'read',
            'critical-error-restore-pointer',
          );
        }
        return undefined;
      }),
    )
  ).filter(
    (pointer): pointer is CriticalErrorRestorePointer => pointer !== undefined,
  );

  return {
    pointer: pointers.reduce<CriticalErrorRestorePointer | undefined>(
      (latest, current) =>
        !latest || current.updatedAt >= latest.updatedAt ? current : latest,
      undefined,
    ),
    hasUnreadablePointers,
  };
}

async function readLegacyRestoreSession(
  browserApi: typeof browser,
): Promise<RestoringTabHandoff | null> {
  try {
    // storage.local survives runtime.reload(); storage.session does not
    return normalizeRestoreSession(
      await readStorageKey(browserApi, CRITICAL_ERROR_RESTORE_KEY),
    );
  } catch (error) {
    // Do not rethrow: throwing would block service worker initialization, even
    // when startup is not a critical-error restore. Treat the read failure like
    // absent session data so default init can proceed.
    captureCriticalErrorRestoreStorageError(
      'critical-error-restore: failed to read legacy restore session',
      error,
      'read',
      'critical-error-restore-legacy-state',
    );
    return null;
  }
}

async function writeRestorePointers(
  browserApi: typeof browser,
  pointer: CriticalErrorRestorePointer,
): Promise<boolean> {
  const pointerValues = Object.fromEntries(
    CriticalErrorRestorePointerKeys.map((pointerKey) => [pointerKey, pointer]),
  );

  try {
    await browserApi.storage.local.set(pointerValues);
    return true;
  } catch (error) {
    captureCriticalErrorRestoreStorageError(
      'critical-error-restore: failed to write restore session pointers',
      error,
      'write',
      'critical-error-restore-pointer',
    );
  }

  let didWritePointer = false;
  for (const pointerKey of CriticalErrorRestorePointerKeys) {
    try {
      await browserApi.storage.local.set({ [pointerKey]: pointer });
      didWritePointer = true;
    } catch (error) {
      captureCriticalErrorRestoreStorageError(
        'critical-error-restore: failed to write restore session pointer',
        error,
        'write',
        'critical-error-restore-pointer',
      );
    }
  }

  return didWritePointer;
}

export async function readCriticalErrorRestoreSession(
  browserApi: typeof browser,
): Promise<RestoringTabHandoff | null> {
  const { pointer, hasUnreadablePointers } =
    await readLatestRestorePointer(browserApi);
  if (pointer) {
    if (pointer.storageKey === null) {
      return null;
    }

    try {
      const generatedSession = normalizeRestoreSession(
        await readStorageKey(browserApi, pointer.storageKey),
      );
      if (generatedSession) {
        return generatedSession;
      }
    } catch (error) {
      captureCriticalErrorRestoreStorageError(
        'critical-error-restore: failed to read generated restore session',
        error,
        'read',
        'critical-error-restore-generated-state',
      );
    }
    return null;
  }

  if (hasUnreadablePointers) {
    return null;
  }

  return await readLegacyRestoreSession(browserApi);
}

/**
 * Publishes a restore session tombstone. Best-effort: if `storage.local.set` fails,
 * the error is wrapped for context, reported to Sentry, and not rethrown so startup
 * can continue.
 *
 * @param browserApi - WebExtension `browser` API (injected for tests).
 */
export async function clearCriticalErrorRestoreSession(
  browserApi: typeof browser,
): Promise<void> {
  await runCriticalErrorRestoreWrite(async () => {
    await writeRestorePointers(browserApi, {
      version: CRITICAL_ERROR_RESTORE_POINTER_VERSION,
      updatedAt: Date.now(),
      storageKey: null,
    });
  });
}

async function writeCriticalErrorRestoreSession(
  value: StoredRestoringTabHandoff,
): Promise<void> {
  await runCriticalErrorRestoreWrite(async () => {
    const storageKey = makeCriticalErrorRestoreValueKey();
    let didWriteGeneratedValue = false;

    try {
      await browser.storage.local.set({ [storageKey]: value });
      didWriteGeneratedValue = true;
    } catch (error) {
      captureCriticalErrorRestoreStorageError(
        'critical-error-restore: failed to save generated restore session to storage.local',
        error,
        'write',
        'critical-error-restore-generated-state',
      );
    }

    if (!didWriteGeneratedValue) {
      return;
    }

    const pointer: CriticalErrorRestorePointer = {
      version: CRITICAL_ERROR_RESTORE_POINTER_VERSION,
      updatedAt: Date.now(),
      storageKey,
    };

    await writeRestorePointers(browser, pointer);
  });
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

  await writeCriticalErrorRestoreSession(value);

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
