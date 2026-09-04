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
  syncOrders?: () => Promise<void>;
};

export async function hasCompletedPortfolioBuyOrdersMigration(): Promise<boolean> {
  const value = await getStorageItem(
    PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY,
  );
  return value === true || value === '1';
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

let migrationInFlight: Promise<void> | null = null;

export async function runPortfolioBuyOrdersMigration(
  options?: MigrationOptions,
): Promise<void> {
  migrationInFlight ??= runPortfolioBuyOrdersMigrationInner(options).finally(
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
    return;
  }

  const timeoutMs = options?.timeoutMs ?? MIGRATE_TIMEOUT_MS;
  const syncOrders = options?.syncOrders ?? syncRampsOrdersWithUserStorage;
  let openedTabId: number | undefined;
  let didMigrate = false;

  try {
    const openedTab = await platform.openTab({
      url: getPortfolioMigrateOrdersUrl(),
      active: false,
    });
    openedTabId = openedTab.id;
    if (openedTabId !== undefined) {
      didMigrate = await waitForMigrateDone(platform, openedTabId, timeoutMs);
    }
  } catch (error) {
    console.error('Portfolio Buy-order migration tab failed', error);
  } finally {
    if (openedTabId !== undefined) {
      await platform.closeTab(openedTabId).catch(() => undefined);
    }
  }

  if (!didMigrate) {
    return;
  }

  try {
    if (!isProduction()) {
      await submitRequestToBackground('performSignOut').catch((error) =>
        console.error('performSignOut before migrate sync failed', error),
      );
    }
    await submitRequestToBackground('performSignIn');
    let syncTimeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        syncOrders(),
        new Promise((_, reject) => {
          syncTimeoutId = setTimeout(
            () => reject(new Error('Ramps order sync timed out')),
            SYNC_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      clearTimeout(syncTimeoutId);
    }
    await setRampsSelectedProvider(null).catch((error) =>
      console.error(
        'Failed to clear selected provider after migrate sync',
        error,
      ),
    );
    await setStorageItem(PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY, true);
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
): Promise<boolean> {
  return new Promise((resolve) => {
    const wait = {
      settled: false,
      timeoutId: undefined as ReturnType<typeof setTimeout> | undefined,
    };

    const finish = (didMigrate: boolean) => {
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
      resolve(didMigrate);
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
        finish(true);
      }
    }

    wait.timeoutId = setTimeout(() => finish(false), timeoutMs);
    platform.addTabUpdatedListener(onUpdated);
  });
}
