import {
  getStorageItem,
  setStorageItem,
} from '../../../../shared/lib/storage-helpers';
import {
  EXT_MIGRATE_ORDERS_ENTRY,
  getPortfolioMigrateOrdersUrl,
  hasCompletedPortfolioBuyOrdersMigration,
  MIGRATE_STATUS_DONE,
  MIGRATE_STATUS_QUERY_PARAM,
  PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY,
  runPortfolioBuyOrdersMigration,
} from './portfolioBuyOrdersMigration';

jest.mock('../../../../shared/lib/storage-helpers', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../store/controller-actions/ramps-controller', () => ({
  setRampsSelectedProvider: jest.fn().mockResolvedValue(undefined),
  syncRampsOrdersWithUserStorage: jest.fn().mockResolvedValue(undefined),
}));

const mockGetStorageItem = getStorageItem as jest.Mock;
const mockSetStorageItem = setStorageItem as jest.Mock;

describe('portfolioBuyOrdersMigration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStorageItem.mockResolvedValue(undefined);
    mockSetStorageItem.mockResolvedValue(undefined);
  });

  it('builds a migrate URL with the Extension entry param', () => {
    const url = getPortfolioMigrateOrdersUrl('https://app.metamask.io');
    expect(url).toBe(
      `https://app.metamask.io/buy?metamaskEntry=${EXT_MIGRATE_ORDERS_ENTRY}`,
    );
  });

  it('hasCompletedPortfolioBuyOrdersMigration reads storage', async () => {
    mockGetStorageItem.mockResolvedValue(true);
    await expect(hasCompletedPortfolioBuyOrdersMigration()).resolves.toBe(true);
    expect(mockGetStorageItem).toHaveBeenCalledWith(
      PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY,
    );
  });

  it('no-ops when migration already completed', async () => {
    mockGetStorageItem.mockResolvedValue(true);
    const platform = {
      openTab: jest.fn(),
      closeTab: jest.fn(),
      addTabUpdatedListener: jest.fn(),
      removeTabUpdatedListener: jest.fn(),
    };
    const syncOrders = jest.fn();

    await runPortfolioBuyOrdersMigration({ platform, syncOrders });

    expect(platform.openTab).not.toHaveBeenCalled();
    expect(syncOrders).not.toHaveBeenCalled();
  });

  it('opens Portfolio, waits for done URL, closes tab, syncs, and marks complete', async () => {
    let tabListener:
      | ((
          tabId: number,
          changeInfo: { url?: string },
          tab?: { url?: string },
        ) => void)
      | undefined;

    const platform = {
      openTab: jest.fn().mockResolvedValue({ id: 42 }),
      closeTab: jest.fn().mockResolvedValue(undefined),
      addTabUpdatedListener: jest.fn((listener) => {
        tabListener = listener;
        // Portfolio signals done after Extension starts listening.
        queueMicrotask(() => {
          listener(42, {
            url: `https://app.metamask.io/buy?metamaskEntry=${EXT_MIGRATE_ORDERS_ENTRY}&${MIGRATE_STATUS_QUERY_PARAM}=${MIGRATE_STATUS_DONE}`,
          });
        });
      }),
      removeTabUpdatedListener: jest.fn(),
    };
    const syncOrders = jest.fn().mockResolvedValue(undefined);

    await runPortfolioBuyOrdersMigration({
      platform,
      syncOrders,
      timeoutMs: 5_000,
    });

    expect(platform.openTab).toHaveBeenCalledWith({
      url: expect.stringContaining(`metamaskEntry=${EXT_MIGRATE_ORDERS_ENTRY}`),
      active: false,
    });
    expect(platform.closeTab).toHaveBeenCalledWith(42);
    expect(syncOrders).toHaveBeenCalledTimes(1);
    expect(mockSetStorageItem).toHaveBeenCalledWith(
      PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY,
      true,
    );
  });

  it('does not mark complete when sync fails so Buy can retry', async () => {
    const platform = {
      openTab: jest.fn().mockResolvedValue({ id: 7 }),
      closeTab: jest.fn().mockResolvedValue(undefined),
      addTabUpdatedListener: jest.fn((listener) => {
        queueMicrotask(() => {
          listener(7, {
            url: `https://app.metamask.io/buy?metamaskEntry=${EXT_MIGRATE_ORDERS_ENTRY}&${MIGRATE_STATUS_QUERY_PARAM}=${MIGRATE_STATUS_DONE}`,
          });
        });
      }),
      removeTabUpdatedListener: jest.fn(),
    };
    const syncOrders = jest
      .fn()
      .mockRejectedValue(new Error('invalid access token'));

    await runPortfolioBuyOrdersMigration({
      platform,
      syncOrders,
      timeoutMs: 5_000,
    });

    expect(syncOrders).toHaveBeenCalledTimes(1);
    expect(mockSetStorageItem).not.toHaveBeenCalledWith(
      PORTFOLIO_BUY_ORDERS_MIGRATION_STORAGE_KEY,
      true,
    );
  });
});
