import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';

const { BrowserStorageAdapter } = jest.requireActual(
  './browser-storage-adapter',
);

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      getKeys: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

describe('BrowserStorageAdapter', () => {
  let adapter: typeof BrowserStorageAdapter;
  const mockGet = jest.mocked(browser.storage.local.get);
  const mockGetKeys = jest.mocked(browser.storage.local.getKeys);
  const mockSet = jest.mocked(browser.storage.local.set);
  const mockRemove = jest.mocked(browser.storage.local.remove);

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new BrowserStorageAdapter();
  });

  describe('getItem', () => {
    it('returns { result } when key exists', async () => {
      const fullKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      mockGet.mockResolvedValue({ [fullKey]: { data: 'test' } });

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(fullKey);
      expect(result).toStrictEqual({ result: { data: 'test' } });
    });

    it('returns {} when key does not exist', async () => {
      mockGet.mockResolvedValue({});

      const result = await adapter.getItem('TestController', 'nonExistent');

      expect(result).toStrictEqual({});
    });

    it('returns { error } on failure', async () => {
      const error = new Error('Storage error');
      mockGet.mockRejectedValue(error);

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({ error });
    });
  });

  describe('setItem', () => {
    it('stores the value with the correct key', async () => {
      mockSet.mockResolvedValue(undefined);

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      const expectedKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      expect(mockSet).toHaveBeenCalledWith({ [expectedKey]: { data: 'test' } });
    });

    it('throws on failure', async () => {
      const error = new Error('Storage error');
      mockSet.mockRejectedValue(error);

      await expect(
        adapter.setItem('TestController', 'myKey', 'value'),
      ).rejects.toThrow('Storage error');
    });
  });

  describe('removeItem', () => {
    it('removes the item with the correct key', async () => {
      mockRemove.mockResolvedValue(undefined);

      await adapter.removeItem('TestController', 'myKey');

      const expectedKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      expect(mockRemove).toHaveBeenCalledWith(expectedKey);
    });

    it('throws on failure', async () => {
      const error = new Error('Storage error');
      mockRemove.mockRejectedValue(error);

      await expect(
        adapter.removeItem('TestController', 'myKey'),
      ).rejects.toThrow('Storage error');
    });
  });

  describe('getAllKeys', () => {
    it('returns only keys for the namespace', async () => {
      mockGetKeys.mockResolvedValue([
        `${STORAGE_KEY_PREFIX}TestController:key1`,
        `${STORAGE_KEY_PREFIX}TestController:key2`,
        `${STORAGE_KEY_PREFIX}OtherController:key3`,
        'unrelatedKey',
      ]);

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual(['key1', 'key2']);
    });

    it('returns empty array when no keys exist', async () => {
      mockGetKeys.mockResolvedValue([]);

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual([]);
    });

    it('falls back to reading all values when getKeys is unavailable', async () => {
      const storageLocalWithoutGetKeys = browser.storage.local as {
        get: typeof browser.storage.local.get;
        getKeys?: typeof browser.storage.local.getKeys;
      };
      const originalGetKeys = storageLocalWithoutGetKeys.getKeys;
      storageLocalWithoutGetKeys.getKeys = undefined;

      try {
        mockGet.mockResolvedValue({
          [`${STORAGE_KEY_PREFIX}TestController:key1`]: 'value1',
          [`${STORAGE_KEY_PREFIX}OtherController:key2`]: 'value2',
        });

        const keys = await adapter.getAllKeys('TestController');

        expect(mockGet).toHaveBeenCalledWith(null);
        expect(keys).toStrictEqual(['key1']);
      } finally {
        storageLocalWithoutGetKeys.getKeys = originalGetKeys;
      }
    });

    it('throws on failure', async () => {
      const error = new Error('Storage error');
      mockGetKeys.mockRejectedValue(error);

      await expect(adapter.getAllKeys('TestController')).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('clear', () => {
    it('removes all keys for the namespace', async () => {
      mockGetKeys.mockResolvedValue([
        `${STORAGE_KEY_PREFIX}TestController:key1`,
        `${STORAGE_KEY_PREFIX}TestController:key2`,
      ]);
      mockRemove.mockResolvedValue(undefined);

      await adapter.clear('TestController');

      expect(mockRemove).toHaveBeenCalledWith([
        `${STORAGE_KEY_PREFIX}TestController:key1`,
        `${STORAGE_KEY_PREFIX}TestController:key2`,
      ]);
    });

    it('does not call remove when no keys exist', async () => {
      mockGetKeys.mockResolvedValue([]);

      await adapter.clear('TestController');

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('throws on failure', async () => {
      mockGetKeys.mockResolvedValue([
        `${STORAGE_KEY_PREFIX}TestController:key1`,
      ]);
      const error = new Error('Storage error');
      mockRemove.mockRejectedValue(error);

      await expect(adapter.clear('TestController')).rejects.toThrow(
        'Storage error',
      );
    });
  });
});
