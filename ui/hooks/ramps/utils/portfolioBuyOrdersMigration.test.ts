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
const doneUrl = `https://app.metamask.io/buy?metamaskEntry=${EXT_MIGRATE_ORDERS_ENTRY}&${MIGRATE_STATUS_QUERY_PARAM}=${MIGRATE_STATUS_DONE}`;

function createPlatform(tabId: number) {
  return {
    openTab: jest.fn().mockResolvedValue({ id: tabId }),
    closeTab: jest.fn().mockResolvedValue(undefined),
    addTabUpdatedListener: jest.fn((listener) => {
      queueMicrotask(() => listener(tabId, { url: doneUrl }));
    }),
    removeTabUpdatedListener: jest.fn(),
  };
}

describe('portfolioBuyOrdersMigration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStorageItem.mockResolvedValue(undefined);
    mockSetStorageItem.mockResolvedValue(undefined);
  });

  it('builds a migrate URL with the Extension entry param', () => {
    expect(getPortfolioMigrateOrdersUrl('https://app.metamask.io')).toBe(
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
    const platform = createPlatform(1);
    const syncOrders = jest.fn();
    await runPortfolioBuyOrdersMigration({ platform, syncOrders });
    expect(platform.openTab).not.toHaveBeenCalled();
    expect(syncOrders).not.toHaveBeenCalled();
  });

  it('opens Portfolio, waits for done URL, closes tab, syncs, and marks complete', async () => {
    const platform = createPlatform(42);
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
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const platform = createPlatform(7);
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
    errorSpy.mockRestore();
  });
});
