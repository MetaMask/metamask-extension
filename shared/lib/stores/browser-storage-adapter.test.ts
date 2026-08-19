import browser from 'webextension-polyfill';
// eslint-disable-next-line @typescript-eslint/no-shadow
import { it } from '@jest/globals';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';

const { BrowserStorageAdapter } = jest.requireActual<
  typeof import('./browser-storage-adapter')
>('./browser-storage-adapter');

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

describe('BrowserStorageAdapter', () => {
  const namespace = 'TestController';
  const key = 'myKey';

  const makeStorageKey = (storageKey: string, storageNamespace = namespace) =>
    `${STORAGE_KEY_PREFIX}${storageNamespace}:${storageKey}`;

  const mockGet = jest.mocked(browser.storage.local.get);
  const mockSet = jest.mocked(browser.storage.local.set);
  const mockRemove = jest.mocked(browser.storage.local.remove);

  let adapter: InstanceType<typeof BrowserStorageAdapter>;

  beforeEach(() => {
    jest.resetAllMocks();
    adapter = new BrowserStorageAdapter();

    // ignore `console.error`, as these are expected, but noisy
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('getItem', () => {
    it('returns the stored value', async () => {
      const fullKey = makeStorageKey(key);
      const value = { data: 'test' };

      mockGet.mockResolvedValue({
        [fullKey]: value,
      });

      const result = await adapter.getItem(namespace, key);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(fullKey);
      expect(result).toStrictEqual({ result: value });
    });

    it.each([
      ['null', null],
      ['false', false],
      ['zero', 0],
      ['empty string', ''],
    ])('returns a stored %s value', async (_description, value) => {
      const fullKey = makeStorageKey(key);

      mockGet.mockResolvedValue({
        [fullKey]: value,
      });

      const result = await adapter.getItem(namespace, key);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(fullKey);
      expect(result).toStrictEqual({ result: value });
    });

    it('returns an empty result when the key does not exist', async () => {
      const fullKey = makeStorageKey('nonExistent');

      mockGet.mockResolvedValue({});

      const result = await adapter.getItem(namespace, 'nonExistent');

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(fullKey);
      expect(result).toStrictEqual({});
    });

    it('returns the original error when storage fails', async () => {
      const error = new Error('Storage error');
      const fullKey = makeStorageKey(key);

      mockGet.mockRejectedValue(error);

      const result = await adapter.getItem(namespace, key);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(fullKey);
      expect(result).toStrictEqual({ error });
    });
  });

  describe('setItem', () => {
    it('stores the value under the fully-qualified storage key', async () => {
      const fullKey = makeStorageKey(key);
      const value = { data: 'test' };

      mockSet.mockResolvedValue(undefined);

      await adapter.setItem(namespace, key, value);

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith({
        [fullKey]: value,
      });
    });

    it('propagates storage failures', async () => {
      const error = new Error('Storage error');
      const fullKey = makeStorageKey(key);

      mockSet.mockRejectedValue(error);

      await expect(adapter.setItem(namespace, key, 'value')).rejects.toBe(
        error,
      );

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith({
        [fullKey]: 'value',
      });
    });
  });

  describe('removeItem', () => {
    it('removes the fully-qualified storage key', async () => {
      const fullKey = makeStorageKey(key);

      mockRemove.mockResolvedValue(undefined);

      await adapter.removeItem(namespace, key);

      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(mockRemove).toHaveBeenCalledWith(fullKey);
    });

    it('propagates storage failures', async () => {
      const error = new Error('Storage error');
      const fullKey = makeStorageKey(key);

      mockRemove.mockRejectedValue(error);

      await expect(adapter.removeItem(namespace, key)).rejects.toBe(error);

      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(mockRemove).toHaveBeenCalledWith(fullKey);
    });
  });

  describe('getAllKeys', () => {
    it('returns only keys belonging to the requested namespace', async () => {
      mockGet.mockResolvedValue({
        [makeStorageKey('key1')]: 'value1',
        [makeStorageKey('key2')]: 'value2',
        [makeStorageKey('key3', 'OtherController')]: 'value3',
        unrelatedKey: 'value4',
      });

      const result = await adapter.getAllKeys(namespace);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(null);
      expect(result).toStrictEqual(['key1', 'key2']);
    });

    it('does not confuse a namespace with another namespace that shares its prefix', async () => {
      mockGet.mockResolvedValue({
        [makeStorageKey('key1')]: 'value1',
        [makeStorageKey('key2', `${namespace}Extra`)]: 'value2',
      });

      const result = await adapter.getAllKeys(namespace);

      expect(result).toStrictEqual(['key1']);
    });

    it('preserves colons contained within the item key', async () => {
      mockGet.mockResolvedValue({
        [makeStorageKey('some:key:with:colons')]: 'value',
      });

      const result = await adapter.getAllKeys(namespace);

      expect(result).toStrictEqual(['some:key:with:colons']);
    });

    it('returns an empty array when no keys belong to the namespace', async () => {
      mockGet.mockResolvedValue({
        [makeStorageKey('key1', 'OtherController')]: 'value1',
        unrelatedKey: 'value2',
      });

      const result = await adapter.getAllKeys(namespace);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(null);
      expect(result).toStrictEqual([]);
    });

    it('propagates storage failures', async () => {
      const error = new Error('Storage error');

      mockGet.mockRejectedValue(error);

      await expect(adapter.getAllKeys(namespace)).rejects.toBe(error);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(null);
    });
  });

  describe('clear', () => {
    it('removes only keys belonging to the requested namespace', async () => {
      const key1 = makeStorageKey('key1');
      const key2 = makeStorageKey('key2');

      mockGet.mockResolvedValue({
        [key1]: 'value1',
        [key2]: 'value2',
        [makeStorageKey('key3', 'OtherController')]: 'value3',
        unrelatedKey: 'value4',
      });
      mockRemove.mockResolvedValue(undefined);

      await adapter.clear(namespace);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(null);
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(mockRemove).toHaveBeenCalledWith([key1, key2]);
    });

    it('does not call remove when the namespace contains no keys', async () => {
      mockGet.mockResolvedValue({
        [makeStorageKey('key1', 'OtherController')]: 'value1',
      });

      await adapter.clear(namespace);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(null);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('does not call remove when key enumeration fails', async () => {
      const error = new Error('Storage read error');

      mockGet.mockRejectedValue(error);

      await expect(adapter.clear(namespace)).rejects.toBe(error);

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('propagates remove failures', async () => {
      const fullKey = makeStorageKey('key1');
      const error = new Error('Storage remove error');

      mockGet.mockResolvedValue({
        [fullKey]: 'value1',
      });
      mockRemove.mockRejectedValue(error);

      await expect(adapter.clear(namespace)).rejects.toBe(error);

      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(mockRemove).toHaveBeenCalledWith([fullKey]);
    });
  });
});
