import browser from 'webextension-polyfill';
import { ChromeStorageLocalBackupStore } from './chrome-storage-local-backup-store';

const BACKUP_KEY = 'metamask-backup';

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

const mockLocalStorage = jest.mocked(browser.storage.local);

describe('ChromeStorageLocalBackupStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores the backup under one chrome.storage.local key', async () => {
    const store = new ChromeStorageLocalBackupStore();
    const backup = {
      KeyringController: { vault: 'vault' },
      meta: { version: 1 },
    };

    await store.set(backup);

    expect(mockLocalStorage.set).toHaveBeenCalledWith({
      [BACKUP_KEY]: backup,
    });
  });

  it('returns requested backup values in order', async () => {
    const store = new ChromeStorageLocalBackupStore();
    jest.mocked(mockLocalStorage.get).mockResolvedValue({
      [BACKUP_KEY]: {
        KeyringController: { vault: 'vault' },
        meta: { version: 1 },
      },
    });

    await expect(store.get(['meta', 'missing', 'KeyringController'])).resolves
      .toStrictEqual([
        { version: 1 },
        undefined,
        { vault: 'vault' },
      ]);
  });

  it('removes the backup key on reset', async () => {
    const store = new ChromeStorageLocalBackupStore();

    await store.reset();

    expect(mockLocalStorage.remove).toHaveBeenCalledWith([BACKUP_KEY]);
  });
});
