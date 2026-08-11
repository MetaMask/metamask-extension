import {
  getStorageItem,
  setStorageItem,
} from '../../../../shared/lib/storage-helpers';
import { isProduction } from '../../../../shared/lib/environment';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  setRampsSelectedProvider,
  syncRampsOrdersWithUserStorage,
} from '../../../store/controller-actions/ramps-controller';

// Bump when migrate must re-run after Profile Sync session-handling fixes.
export const PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY =
  'portfolio-buy-orders-migration-v13';
export const EXT_MIGRATE_ORDERS_ENTRY = 'ext_migrate_orders';
export const MIGRATE_STATUS_QUERY_PARAM = 'migrateStatus';
export const MIGRATE_STATUS_DONE = 'done';
const DEFAULT_PORTFOLIO_URL = 'https://app.metamask.io';
const MIGRATE_TIMEOUT_MS = 45_000;
const SYNC_TIMEOUT_MS = 12_000;

type PlatformTabApi = {
  openTab: (options: {
    url: string;
    active?: boolean;
  }) => Promise<{ id?: number }>;
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

type MigrationOptions = {
  platform?: PlatformTabApi;
  timeoutMs?: number;
  syncTimeoutMs?: number;
  syncOrders?: () => Promise<void>;
};

export async function hasCompletedPortfolioBuyOrdersMigration(): Promise<boolean> {
  const value = await getStorageItem(
    PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY,
  );
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

async function withTimeout<Result>(
  promise: Promise<Result>,
  timeoutMs: number,
  label: string,
): Promise<Result> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<Result>((_, reject) => {
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

let migrationInFlight: Promise<void> | null = null;

/**
 * Opens Portfolio migrate tab, syncs orders, marks complete after sync. @param options
 * @param options
 */
export async function runPortfolioBuyOrdersMigration(
  options?: MigrationOptions,
): Promise<void> {
  if (migrationInFlight) {
    await migrationInFlight;
    return;
  }
  migrationInFlight = runPortfolioBuyOrdersMigrationInner(options).finally(
    () => {
      migrationInFlight = null;
    },
  );
  await migrationInFlight;
}

async function runPortfolioBuyOrdersMigrationInner(
  options?: MigrationOptions,
): Promise<void> {
  if (await hasCompletedPortfolioBuyOrdersMigration()) {
    return;
  }

  const platform =
    options?.platform ?? (globalThis as { platform?: PlatformTabApi }).platform;
  if (!platform?.openTab || !platform?.closeTab) {
    await markPortfolioBuyOrdersMigrationCompleted();
    return;
  }

  const timeoutMs = options?.timeoutMs ?? MIGRATE_TIMEOUT_MS;
  const syncTimeoutMs = options?.syncTimeoutMs ?? SYNC_TIMEOUT_MS;
  const syncOrders = options?.syncOrders ?? syncRampsOrdersWithUserStorage;
  let openedTabId: number | undefined;

  try {
    const openedTab = await platform.openTab({
      url: getPortfolioMigrateOrdersUrl(),
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

  try {
    // Non-prod only: clear stale local sessions. Never sign out in production.
    if (!isProduction()) {
      try {
        await submitRequestToBackground('performSignOut');
      } catch (signOutError) {
        console.error(
          'performSignOut before migrate sync failed',
          signOutError,
        );
      }
    }
    await submitRequestToBackground('performSignIn');
    await withTimeout(
      syncOrders(),
      syncTimeoutMs,
      'syncRampsOrdersWithUserStorage',
    );
    try {
      await setRampsSelectedProvider(null);
    } catch (clearError) {
      console.error(
        'Failed to clear selected provider after migrate sync',
        clearError,
      );
    }
    await markPortfolioBuyOrdersMigrationCompleted();
  } catch (error) {
    console.error(
      'syncRampsOrdersWithUserStorage after Portfolio migrate failed',
      error,
    );
  }
}

function waitForMigrateDone(
  platform: PlatformTabApi,
  openedTabId: number,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const wait = {
      settled: false,
      timeoutId: undefined as ReturnType<typeof setTimeout> | undefined,
    };

    const finish = () => {
      if (wait.settled) {
        return;
      }
      wait.settled = true;
      platform.removeTabUpdatedListener(
        onUpdated as (...args: unknown[]) => void,
      );
      if (wait.timeoutId !== undefined) {
        clearTimeout(wait.timeoutId);
      }
      resolve();
    };

    function onUpdated(
      tabId: number,
      changeInfo: { url?: string; pendingUrl?: string },
      tab?: { url?: string },
    ) {
      if (tabId !== openedTabId) {
        return;
      }
      if (
        isMigrateDoneUrl(changeInfo?.url || changeInfo?.pendingUrl || tab?.url)
      ) {
        finish();
      }
    }

    wait.timeoutId = setTimeout(finish, timeoutMs);
    platform.addTabUpdatedListener(onUpdated);
  });
}
