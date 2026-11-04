import browser from 'webextension-polyfill';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../constants/app';
import { getEnvironmentType } from '../environment-type';
import { isManifestV3 } from '../mv3.utils';

/**
 * Elapsed-time signals for state-write telemetry.
 *
 * Activity timestamps and the first app-start time are kept in
 * `storage.session` on MV3 so they survive a service-worker restart within
 * the browser session. `msSinceLastServiceWorkerReload` is this worker's
 * lifetime (only reported after at least one reload) and is not restored.
 *
 * `storage.session` is shared by every context (background and each open UI).
 * Only the background hydrates and persists it, so a popup or side panel
 * opening doesn't get counted as a service-worker reload, or clobber newer
 * background timestamps with stale ones. UI contexts only import this module
 * transitively (via `PersistenceManager`); they never call `persist()`, so
 * they never read `getLastActivityContext()` either.
 */

/**
 * Single session key for last-activity timestamps.
 *
 * Absent on the first worker in a browser session. Later workers restore
 * timestamps and treat an existing record as a reload.
 */
const LAST_ACTIVITY_SESSION_KEY = 'lastActivity';

type PersistedLastActivity = {
  appStartedAt?: number;
  lastWriteAt?: number;
  lastUiOpenAt?: number;
  lastUiClosedAt?: number;
  lastWindowEventAt?: number;
  serviceWorkerReloadCount?: number;
};

export type LastActivityContext = {
  msSinceLastAppStart?: number;
  msSinceLastWrite?: number;
  msSinceLastUiOpen?: number;
  msSinceLastUiClosed?: number;
  msSinceLastWindowEvent?: number;
  msSinceLastServiceWorkerReload?: number;
  serviceWorkerReloadCount?: number;
};

/** Set once per module load. Current service-worker start. */
const serviceWorkerStartedAt = Date.now();

/**
 * First extension wake in this browser session. Restored from session when
 * present, otherwise equals {@link serviceWorkerStartedAt}.
 */
let appStartedAt = serviceWorkerStartedAt;

let lastWriteAt: number | undefined;
let lastUiOpenAt: number | undefined;
let lastUiClosedAt: number | undefined;
let lastWindowEventAt: number | undefined;
let serviceWorkerReloadCount: number | undefined;

/**
 * Whether any MetaMask UI is currently open. Updated by
 * {@link recordUiOpen} / {@link recordUiClosed}, and restored after hydrate
 * from the relative UI open/close timestamps.
 */
let isAnyUiOpen = false;

let hydrated = false;
let hydratePromise: Promise<void> | undefined;

/**
 * Infers UI-open presence from restored timestamps so a service-worker
 * restart does not briefly report "all closed" while UIs are reconnecting.
 */
function syncIsAnyUiOpenFromTimestamps(): void {
  if (lastUiOpenAt === undefined) {
    isAnyUiOpen = false;
    return;
  }
  if (lastUiClosedAt === undefined) {
    isAnyUiOpen = true;
    return;
  }
  isAnyUiOpen = lastUiOpenAt >= lastUiClosedAt;
}

/**
 * @param at - Timestamp of the last occurrence, if any.
 * @param now - Current time.
 * @returns Milliseconds elapsed, or `undefined` if `at` is unset.
 */
function msSince(at: number | undefined, now: number): number | undefined {
  return at === undefined ? undefined : now - at;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function keepNewer(
  current: number | undefined,
  stored: number | undefined,
): number | undefined {
  return current === undefined ? stored : current;
}

/**
 * Whether this module is running in the background (service worker), as
 * opposed to a UI context (popup, side panel, fullscreen, or notification
 * window). See the module docblock for why this matters.
 */
function isBackgroundEnvironment(): boolean {
  const href = globalThis.self?.location?.href;
  return (
    href !== undefined &&
    href !== '' &&
    getEnvironmentType(href) === ENVIRONMENT_TYPE_BACKGROUND
  );
}

/**
 * Best-effort persist of last-activity timestamps in session (MV3). No-op on
 * MV2, outside the background, and before hydrate finishes. Failures are
 * ignored so telemetry storage errors do not block callers.
 */
async function setSessionLastActivity(): Promise<void> {
  if (!isManifestV3 || !hydrated || !isBackgroundEnvironment()) {
    return;
  }

  const value: PersistedLastActivity = {
    appStartedAt,
  };
  if (lastWriteAt !== undefined) {
    value.lastWriteAt = lastWriteAt;
  }
  if (lastUiOpenAt !== undefined) {
    value.lastUiOpenAt = lastUiOpenAt;
  }
  if (lastUiClosedAt !== undefined) {
    value.lastUiClosedAt = lastUiClosedAt;
  }
  if (lastWindowEventAt !== undefined) {
    value.lastWindowEventAt = lastWindowEventAt;
  }
  if (serviceWorkerReloadCount !== undefined) {
    value.serviceWorkerReloadCount = serviceWorkerReloadCount;
  }

  try {
    await browser.storage.session.set({
      [LAST_ACTIVITY_SESSION_KEY]: value,
    });
  } catch {
    // Keep in-memory timestamps. A missed session write only affects restore
    // after the next service-worker restart.
  }
}

async function hydrateFromSession(): Promise<void> {
  if (!isManifestV3 || !isBackgroundEnvironment()) {
    hydrated = true;
    return;
  }

  try {
    const sessionData = await browser.storage.session.get([
      LAST_ACTIVITY_SESSION_KEY,
    ]);
    const stored = sessionData?.[LAST_ACTIVITY_SESSION_KEY];
    if (typeof stored === 'object' && stored !== null) {
      const record = stored as Record<string, unknown>;
      const storedAppStartedAt = readNumber(record, 'appStartedAt');
      if (storedAppStartedAt !== undefined) {
        appStartedAt = storedAppStartedAt;
      }
      lastWriteAt = keepNewer(lastWriteAt, readNumber(record, 'lastWriteAt'));
      lastUiOpenAt = keepNewer(
        lastUiOpenAt,
        readNumber(record, 'lastUiOpenAt'),
      );
      lastUiClosedAt = keepNewer(
        lastUiClosedAt,
        readNumber(record, 'lastUiClosedAt'),
      );
      lastWindowEventAt = keepNewer(
        lastWindowEventAt,
        readNumber(record, 'lastWindowEventAt'),
      );
      const previousCount = readNumber(record, 'serviceWorkerReloadCount');
      serviceWorkerReloadCount = (previousCount ?? 0) + 1;
      syncIsAnyUiOpenFromTimestamps();
    } else {
      serviceWorkerReloadCount = 0;
    }
  } catch {
    // Telemetry must not block startup when session storage is unavailable.
    // Leave `hydrated` false so later record* calls cannot overwrite an
    // existing session record with unhydrated defaults.
    return;
  }

  hydrated = true;
  await setSessionLastActivity();
}

/**
 * Restores session timestamps and reload counters. Safe to call more than once.
 *
 * @returns Resolves when hydrate has finished (or failed open).
 */
export function hydrateLastActivity(): Promise<void> {
  hydratePromise ??= hydrateFromSession();
  return hydratePromise;
}

hydrateLastActivity().catch(() => {
  // hydrateFromSession already handles its own failures.
});

/**
 * Marks a successful split-state write.
 *
 * Call on every write (not only sampled ones). Snapshot last-activity before
 * calling this for the same write, or `msSinceLastWrite` will be ~0.
 */
export function recordWrite(): void {
  lastWriteAt = Date.now();
  setSessionLastActivity().catch(() => undefined);
}

/** Marks a MetaMask UI connection (popup, side panel, notification, or tab). */
export function recordUiOpen(): void {
  lastUiOpenAt = Date.now();
  isAnyUiOpen = true;
  setSessionLastActivity().catch(() => undefined);
}

/**
 * Marks that every MetaMask UI has closed. Call only on the 1→0 transition.
 */
export function recordUiClosed(): void {
  lastUiClosedAt = Date.now();
  isAnyUiOpen = false;
  setSessionLastActivity().catch(() => undefined);
}

/**
 * Marks a browser window focus change, including focus lost (`WINDOW_ID_NONE`).
 */
export function recordWindowEvent(): void {
  lastWindowEventAt = Date.now();
  setSessionLastActivity().catch(() => undefined);
}

/**
 * Current elapsed-time snapshot. Unset signals are omitted.
 *
 * `msSinceLastUiOpen` is only set while at least one UI is open.
 * `msSinceLastUiClosed` is only set while every UI is closed.
 * `msSinceLastServiceWorkerReload` is only set after at least one reload
 * (`serviceWorkerReloadCount > 0`).
 *
 * @param now - Current time. Injectable for tests.
 * @returns The current {@link LastActivityContext}.
 */
export function getLastActivityContext(
  now: number = Date.now(),
): LastActivityContext {
  const context: LastActivityContext = {
    msSinceLastAppStart: now - appStartedAt,
  };

  const msSinceLastWrite = msSince(lastWriteAt, now);
  if (msSinceLastWrite !== undefined) {
    context.msSinceLastWrite = msSinceLastWrite;
  }

  if (isAnyUiOpen) {
    const msSinceLastUiOpen = msSince(lastUiOpenAt, now);
    if (msSinceLastUiOpen !== undefined) {
      context.msSinceLastUiOpen = msSinceLastUiOpen;
    }
  } else {
    const msSinceLastUiClosed = msSince(lastUiClosedAt, now);
    if (msSinceLastUiClosed !== undefined) {
      context.msSinceLastUiClosed = msSinceLastUiClosed;
    }
  }

  const msSinceLastWindowEvent = msSince(lastWindowEventAt, now);
  if (msSinceLastWindowEvent !== undefined) {
    context.msSinceLastWindowEvent = msSinceLastWindowEvent;
  }

  if (serviceWorkerReloadCount !== undefined) {
    context.serviceWorkerReloadCount = serviceWorkerReloadCount;
    if (serviceWorkerReloadCount > 0) {
      context.msSinceLastServiceWorkerReload = now - serviceWorkerStartedAt;
    }
  }

  return context;
}
