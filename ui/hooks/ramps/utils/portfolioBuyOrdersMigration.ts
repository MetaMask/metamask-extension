import {
  getStorageItem,
  setStorageItem,
} from '../../../../shared/lib/storage-helpers';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  setRampsSelectedProvider,
  syncRampsOrdersWithUserStorage,
} from '../../../store/controller-actions/ramps-controller';

// Bump when migrate must re-run after fixing Portfolio Profile Sync session
// handling (stale auth could mark migrate done without a successful upload).
export const PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY =
  'portfolio-buy-orders-migration-v13';

export const EXT_MIGRATE_ORDERS_ENTRY = 'ext_migrate_orders';
export const MIGRATE_STATUS_QUERY_PARAM = 'migrateStatus';
export const MIGRATE_STATUS_DONE = 'done';

const DEFAULT_PORTFOLIO_URL = 'https://app.metamask.io';
const MIGRATE_TIMEOUT_MS = 45_000;
/** Soft cap so a hung User Storage sync cannot block native Buy forever. */
const SYNC_TIMEOUT_MS = 12_000;

type PlatformTabApi = {
  openTab: (options: { url: string; active?: boolean }) => Promise<{ id?: number }>;
  closeTab: (tabId: number) => Promise<void>;
  addTabUpdatedListener: (
    listener: (
      tabId: number,
      changeInfo: { url?: string; pendingUrl?: string },
      tab?: { url?: string },
    ) => void,
  ) => void;
  removeTabUpdatedListener: (listener: (...args: unknown[]) => void) => void;
};

export async function hasCompletedPortfolioBuyOrdersMigration(): Promise<boolean> {
  const value = await getStorageItem(PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY);
  return value === true || value === '1';
}

export async function markPortfolioBuyOrdersMigrationCompleted(): Promise<void> {
  await setStorageItem(PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY, true);
}

export function getPortfolioMigrateOrdersUrl(
  portfolioBaseUrl: string = process.env.PORTFOLIO_URL || DEFAULT_PORTFOLIO_URL,
): string {
  const url = new URL(portfolioBaseUrl);
  url.pathname = 'buy';
  url.searchParams.set('metamaskEntry', EXT_MIGRATE_ORDERS_ENTRY);
  return url.toString();
}

function isMigrateDoneUrl(candidateUrl: string | undefined): boolean {
  if (!candidateUrl) {
    return false;
  }
  try {
    const url = new URL(candidateUrl);
    return (
      url.searchParams.get('metamaskEntry') === EXT_MIGRATE_ORDERS_ENTRY &&
      url.searchParams.get(MIGRATE_STATUS_QUERY_PARAM) === MIGRATE_STATUS_DONE
    );
  } catch {
    return false;
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Opens a background Portfolio tab to upload Buy orders, waits for the done
 * signal (URL query), closes the tab, syncs User Storage into RampsController,
 * and marks migration attempted so we do not open Portfolio again.
 */
let migrationInFlight: Promise<void> | null = null;

export async function runPortfolioBuyOrdersMigration(options?: {
  platform?: PlatformTabApi;
  timeoutMs?: number;
  syncTimeoutMs?: number;
  syncOrders?: () => Promise<void>;
}): Promise<void> {
  if (migrationInFlight) {
    await migrationInFlight;
    return;
  }

  migrationInFlight = runPortfolioBuyOrdersMigrationInner(options).finally(() => {
    migrationInFlight = null;
  });
  await migrationInFlight;
}

async function runPortfolioBuyOrdersMigrationInner(options?: {
  platform?: PlatformTabApi;
  timeoutMs?: number;
  syncTimeoutMs?: number;
  syncOrders?: () => Promise<void>;
}): Promise<void> {
  const alreadyDone = await hasCompletedPortfolioBuyOrdersMigration();
  if (alreadyDone) {
    return;
  }

  const platform =
    options?.platform ??
    (globalThis as { platform?: PlatformTabApi }).platform;
  if (!platform?.openTab || !platform?.closeTab) {
    await markPortfolioBuyOrdersMigrationCompleted();
    return;
  }

  const timeoutMs = options?.timeoutMs ?? MIGRATE_TIMEOUT_MS;
  const syncTimeoutMs = options?.syncTimeoutMs ?? SYNC_TIMEOUT_MS;
  const syncOrders = options?.syncOrders ?? syncRampsOrdersWithUserStorage;
  const migrateUrl = getPortfolioMigrateOrdersUrl();

  let openedTabId: number | undefined;
  try {
    const openedTab = await platform.openTab({
      url: migrateUrl,
      active: false,
    });
    openedTabId = openedTab.id;

    if (openedTabId !== undefined) {
      await waitForMigrateDone(platform, openedTabId, timeoutMs);
    }
  } catch (error) {
    console.error('Portfolio Buy-order migration tab failed', error);
  } finally {
    if (openedTabId !== undefined) {
      try {
        await platform.closeTab(openedTabId);
      } catch {
        // Tab may already be closed.
      }
    }
  }

  let syncSucceeded = false;
  try {
    // Drop any stale DEV/UAT bearer, then mint a fresh session for the
    // configured Profile Sync env (local yarn start → PRD, for UAT on-ramp).
    try {
      await submitRequestToBackground('performSignOut');
    } catch (signOutError) {
      console.error('performSignOut before migrate sync failed', signOutError);
    }
    await submitRequestToBackground('performSignIn');

    await withTimeout(syncOrders(), syncTimeoutMs, 'syncRampsOrdersWithUserStorage');

    // Clear any pre-migrate auto-selection (often Transak with empty history)
    // so preferred-provider can re-run against synced completed orders.
    try {
      await setRampsSelectedProvider(null);
    } catch (clearError) {
      console.error('Failed to clear selected provider after migrate sync', clearError);
    }

    syncSucceeded = true;
  } catch (error) {
    console.error('syncRampsOrdersWithUserStorage after Portfolio migrate failed', error);
  }

  // Only mark complete when sync succeeded — otherwise the next Buy re-runs
  // migrate+sync (previous bug: invalid token still marked done → permanent Transak).
  if (syncSucceeded) {
    await markPortfolioBuyOrdersMigrationCompleted();
  }
}

function waitForMigrateDone(
  platform: PlatformTabApi,
  openedTabId: number,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      platform.removeTabUpdatedListener(onUpdated);
      clearTimeout(timeoutId);
      resolve();
    };

    const onUpdated = (
      tabId: number,
      changeInfo: { url?: string; pendingUrl?: string },
      tab?: { url?: string },
    ) => {
      if (tabId !== openedTabId) {
        return;
      }
      const candidateUrl =
        changeInfo?.url || changeInfo?.pendingUrl || tab?.url;
      if (isMigrateDoneUrl(candidateUrl)) {
        finish();
      }
    };

    const timeoutId = setTimeout(finish, timeoutMs);
    platform.addTabUpdatedListener(onUpdated);
  });
}
