import browser from 'webextension-polyfill';
import ExtensionStore from './extension-store';

const MOCK_STATE = { data: {}, meta: { version: 1 } };
const CHUNK_MANIFEST_KEY = '__metamaskChunkManifest';
const STORAGE_KEY_MANIFEST_KEYS = [
  '__metamaskStorageKeyManifest0',
  '__metamaskStorageKeyManifest1',
  '__metamaskStorageKeyManifest2',
  '__metamaskStorageKeyManifest3',
] as const;
const STORAGE_KEY_LIST_KEYS = [
  '__metamaskStorageKeyList0',
  '__metamaskStorageKeyList1',
  '__metamaskStorageKeyList2',
  '__metamaskStorageKeyList3',
] as const;
const STORAGE_KEY_POINTER_PREFIX = '__metamaskStorageKeyPointer:';
const STORAGE_KEY_POINTER_SLOTS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
] as const;
const STATE_STORAGE_KEY_PREFIX = '__metamaskState:';

type TestStorageKeyManifest = {
  version: number;
  updatedAt: number;
  storageKeys: Record<string, string>;
};

type TestStorageKeyPointer = {
  version: number;
  updatedAt: number;
  storageKey: string | null;
};

type TestStorageKeyList = {
  version: number;
  updatedAt: number;
  keys: string[];
};

global.sentry = global.sentry || {};

jest.mock('webextension-polyfill', () => ({
  runtime: { lastError: null },
  storage: { local: true },
}));

const setup = (
  options: {
    localMock?: { get?: unknown; set?: unknown; remove?: unknown } | false;
  } = {},
) => {
  if (typeof options.localMock === 'undefined') {
    // @ts-expect-error Mock used just to spy on calls, doesn't implement API
    jest.replaceProperty(browser.storage, 'local', jest.fn());
  } else if (options.localMock === false) {
    const storageApi: Partial<typeof browser.storage> = { ...browser.storage };
    delete storageApi.local;
    // @ts-expect-error Intentionally incomplete to test behavior when API is missing
    jest.replaceProperty(browser, 'storage', storageApi);
  } else {
    // @ts-expect-error Incomplete mock, it just has the properties we call
    jest.replaceProperty(browser.storage, 'local', options.localMock);
  }
  return new ExtensionStore();
};

const createMemoryStorage = (
  initialState: Record<string, unknown> = {},
  corruptedKeys: Set<string> = new Set(),
) => {
  const storage = new Map(Object.entries(initialState));
  const throwIfCorrupt = (keys: string[]) => {
    const corruptKey = keys.find((key) => corruptedKeys.has(key));
    if (corruptKey) {
      throw new Error(`block checksum mismatch for ${corruptKey}`);
    }
  };
  const localMock = {
    get: jest.fn(async (keys: string[] | string | null) => {
      let selectedKeys: string[];
      if (keys === null) {
        selectedKeys = [...storage.keys()];
      } else if (Array.isArray(keys)) {
        selectedKeys = keys;
      } else {
        selectedKeys = [keys];
      }
      throwIfCorrupt(selectedKeys);
      return Object.fromEntries(
        selectedKeys
          .filter((key) => storage.has(key))
          .map((key) => [key, storage.get(key)]),
      );
    }),
    set: jest.fn(async (values: Record<string, unknown>) => {
      throwIfCorrupt(Object.keys(values));
      for (const [key, value] of Object.entries(values)) {
        storage.set(key, value);
      }
    }),
    remove: jest.fn(async (keys: string[] | string) => {
      const keysToRemove = Array.isArray(keys) ? keys : [keys];
      throwIfCorrupt(keysToRemove);
      for (const key of keysToRemove) {
        storage.delete(key);
      }
    }),
  };

  return { localMock, storage };
};

const getStorageKeyManifestFromRecord = (
  record: Record<string, unknown>,
): TestStorageKeyManifest => {
  for (const key of STORAGE_KEY_MANIFEST_KEYS) {
    const manifest = record[key] as TestStorageKeyManifest | undefined;
    if (manifest) {
      return manifest;
    }
  }
  throw new Error('Storage key manifest was not written');
};

const getLatestStorageKeyManifest = (
  storage: Map<string, unknown>,
): TestStorageKeyManifest => {
  let latestManifest: TestStorageKeyManifest | undefined;
  for (const key of STORAGE_KEY_MANIFEST_KEYS) {
    const manifest = storage.get(key) as TestStorageKeyManifest | undefined;
    if (
      manifest &&
      (!latestManifest || manifest.updatedAt >= latestManifest.updatedAt)
    ) {
      latestManifest = manifest;
    }
  }
  if (!latestManifest) {
    throw new Error('Storage key manifest was not written');
  }
  return latestManifest;
};

const getLatestStorageKeyManifestKey = (storage: Map<string, unknown>) => {
  let latestManifestKey: string | undefined;
  let latestManifest: TestStorageKeyManifest | undefined;
  for (const key of STORAGE_KEY_MANIFEST_KEYS) {
    const manifest = storage.get(key) as TestStorageKeyManifest | undefined;
    if (
      manifest &&
      (!latestManifest || manifest.updatedAt >= latestManifest.updatedAt)
    ) {
      latestManifest = manifest;
      latestManifestKey = key;
    }
  }
  if (!latestManifestKey) {
    throw new Error('Storage key manifest was not written');
  }
  return latestManifestKey;
};

const getStorageKey = (
  storage: Map<string, unknown>,
  logicalKey: string,
): string => {
  const storageKey =
    getLatestStorageKeyManifest(storage).storageKeys[logicalKey];
  if (!storageKey) {
    throw new Error(`Storage key for ${logicalKey} was not written`);
  }
  return storageKey;
};

const getChunkKeys = (
  storage: Map<string, unknown>,
  logicalKey: string,
): string[] => {
  const storageKey = getStorageKey(storage, logicalKey);
  const storedValue = storage.get(storageKey);
  if (
    typeof storedValue !== 'object' ||
    storedValue === null ||
    !('chunkKeys' in storedValue) ||
    !Array.isArray(storedValue.chunkKeys)
  ) {
    throw new Error(`Chunk keys for ${logicalKey} were not written`);
  }
  return storedValue.chunkKeys;
};

const makeStorageKeyPointerKeys = (logicalKey: string): string[] =>
  STORAGE_KEY_POINTER_SLOTS.map(
    (slot) =>
      `${STORAGE_KEY_POINTER_PREFIX}${encodeURIComponent(logicalKey)}:${slot}`,
  );

const getLatestStorageKeyPointer = (
  storage: Map<string, unknown>,
  logicalKey: string,
): TestStorageKeyPointer => {
  let latestPointer: TestStorageKeyPointer | undefined;
  for (const pointerKey of makeStorageKeyPointerKeys(logicalKey)) {
    const pointer = storage.get(pointerKey) as
      | TestStorageKeyPointer
      | undefined;
    if (
      pointer &&
      (!latestPointer || pointer.updatedAt >= latestPointer.updatedAt)
    ) {
      latestPointer = pointer;
    }
  }
  if (!latestPointer) {
    throw new Error(`Storage key pointer for ${logicalKey} was not written`);
  }
  return latestPointer;
};

const getLatestStorageKeyPointerStorageKey = (
  storage: Map<string, unknown>,
  logicalKey: string,
): string => {
  const { storageKey } = getLatestStorageKeyPointer(storage, logicalKey);
  if (typeof storageKey !== 'string') {
    throw new Error(`Storage key pointer for ${logicalKey} is a tombstone`);
  }
  return storageKey;
};

const getLatestStorageKeyList = (
  storage: Map<string, unknown>,
): TestStorageKeyList => {
  let latestKeyList: TestStorageKeyList | undefined;
  for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
    const keyList = storage.get(storageKeyListKey) as
      | TestStorageKeyList
      | undefined;
    if (
      keyList &&
      (!latestKeyList || keyList.updatedAt >= latestKeyList.updatedAt)
    ) {
      latestKeyList = keyList;
    }
  }
  if (!latestKeyList) {
    throw new Error('Storage key list was not written');
  }
  return latestKeyList;
};

describe('ExtensionStore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  describe('constructor', () => {
    it('sets isSupported property to false when browser does not support local storage', () => {
      const localStore = setup({ localMock: false });

      expect(localStore.isSupported).toBe(false);
    });

    it('sets isSupported property to true when browser supports local storage', () => {
      const localStore = setup();
      expect(localStore.isSupported).toBe(true);
    });
  });

  describe('set', () => {
    it('throws an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      await expect(() => localStore.set(MOCK_STATE)).rejects.toThrow(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
      );
    });

    it('throws an error if passed a valid argument and metadata has been set', async () => {
      const setMock = jest.fn();

      const localStore = setup({ localMock: { set: setMock } });
      await expect(async function () {
        localStore.set(MOCK_STATE);
      }).not.toThrow();
    });

    it('writes data and meta to generated storage keys', async () => {
      const setMock = jest.fn();
      const localStore = setup({ localMock: { set: setMock } });

      await localStore.set(MOCK_STATE);

      const writtenState = setMock.mock.calls[0][0] as Record<string, unknown>;
      const storageKeyManifest = getStorageKeyManifestFromRecord(writtenState);
      const dataStorageKey = storageKeyManifest.storageKeys.data;
      const metaStorageKey = storageKeyManifest.storageKeys.meta;
      expect(dataStorageKey).toContain(STATE_STORAGE_KEY_PREFIX);
      expect(metaStorageKey).toContain(STATE_STORAGE_KEY_PREFIX);
      expect(writtenState).not.toHaveProperty('data');
      expect(writtenState).not.toHaveProperty('meta');
      expect(writtenState[dataStorageKey]).toStrictEqual(MOCK_STATE.data);
      expect(writtenState[metaStorageKey]).toStrictEqual(MOCK_STATE.meta);
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS.slice(1)) {
        expect(setMock).toHaveBeenCalledWith({
          [storageKeyManifestKey]: storageKeyManifest,
        });
      }
      expect(
        setMock.mock.calls.some((call) =>
          Object.prototype.hasOwnProperty.call(call[0], CHUNK_MANIFEST_KEY),
        ),
      ).toBe(false);
    });

    it('ends the overwrite timer when browser storage.local.set throws', async () => {
      const timeSpy = jest
        .spyOn(console, 'time')
        .mockImplementation(() => undefined);
      const timeEndSpy = jest
        .spyOn(console, 'timeEnd')
        .mockImplementation(() => undefined);
      const localStore = setup({
        localMock: {
          set: jest.fn().mockRejectedValue(new Error('Failed to write state')),
        },
      });

      try {
        await expect(localStore.set(MOCK_STATE)).rejects.toThrow(
          'Failed to write state',
        );

        expect(timeSpy).toHaveBeenCalledWith(
          '[ExtensionStore]: Overwriting local store',
        );
        expect(timeEndSpy).toHaveBeenCalledWith(
          '[ExtensionStore]: Overwriting local store',
        );
      } finally {
        timeSpy.mockRestore();
        timeEndSpy.mockRestore();
      }
    });

    it('tags generated root manifest write errors for Sentry', async () => {
      const originalSentry = global.sentry;
      const captureException = jest.fn();
      global.sentry = { captureException } as typeof global.sentry;
      const corruptedKeys = new Set<string>(STORAGE_KEY_MANIFEST_KEYS);
      const { localMock } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      try {
        await localStore.set(MOCK_STATE);

        expect(captureException).toHaveBeenCalledWith(
          expect.any(AggregateError),
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.storage_area': 'local',
              'persistence.storage_operation': 'write',
              'persistence.storage_key_class': 'generated-root-manifest',
            }),
          }),
        );
      } finally {
        global.sentry = originalSentry;
      }
    });

    it('tags generated pointer write errors for Sentry', async () => {
      const originalSentry = global.sentry;
      const captureException = jest.fn();
      global.sentry = { captureException } as typeof global.sentry;
      const corruptedKeys = new Set<string>([
        makeStorageKeyPointerKeys('data')[0],
      ]);
      const { localMock } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      try {
        await localStore.set(MOCK_STATE);

        expect(captureException).toHaveBeenCalledWith(
          expect.any(AggregateError),
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.storage_area': 'local',
              'persistence.storage_operation': 'write',
              'persistence.storage_key_class': 'generated-pointer',
            }),
          }),
        );
      } finally {
        global.sentry = originalSentry;
      }
    });

    it('reads solid state written to generated storage keys', async () => {
      const { localMock } = createMemoryStorage();
      const localStore = setup({ localMock });

      await localStore.set(MOCK_STATE);
      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(MOCK_STATE);
    });

    it('does not remove stale fixed solid keys after writing generated storage metadata', async () => {
      const corruptedKeys = new Set(['manifest', 'data', 'meta']);
      const { localMock, storage } = createMemoryStorage(
        {
          manifest: ['data', 'meta'],
          data: { stale: true },
          meta: { version: 0 },
        },
        corruptedKeys,
      );
      const localStore = setup({ localMock });

      await localStore.set(MOCK_STATE);

      expect(storage.has('manifest')).toBe(true);
      expect(storage.has('data')).toBe(true);
      expect(storage.has('meta')).toBe(true);
      expect(localMock.remove).not.toHaveBeenCalledWith(
        expect.arrayContaining(['manifest']),
      );
      expect(localMock.remove).not.toHaveBeenCalledWith(
        expect.arrayContaining(['data']),
      );
      expect(localMock.remove).not.toHaveBeenCalledWith(
        expect.arrayContaining(['meta']),
      );

      const result = await localStore.get();
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(MOCK_STATE);
    });

    it('does not reuse in-memory generated manifests after reset removes metadata', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
        ]),
      );
      const oldKeyringStorageKey = getStorageKey(storage, 'KeyringController');

      await localStore.reset();
      localMock.get.mockClear();
      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({});
      expect(localMock.get).not.toHaveBeenCalledWith([oldKeyringStorageKey]);
    });

    it('removes generated split state from a fresh store instance reset', async () => {
      const { localMock, storage } = createMemoryStorage();
      const writer = setup({ localMock });
      const largeValue = { blob: 'a'.repeat(600 * 1024) };

      await writer.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', largeValue],
        ]),
      );
      const keyringStorageKey = getStorageKey(storage, 'KeyringController');
      const largeControllerStorageKey = getStorageKey(
        storage,
        'LargeController',
      );
      const largeControllerChunkKeys = getChunkKeys(storage, 'LargeController');

      const resetStore = setup({ localMock });
      await resetStore.reset();

      expect(storage.has(keyringStorageKey)).toBe(false);
      expect(storage.has(largeControllerStorageKey)).toBe(false);
      for (const chunkKey of largeControllerChunkKeys) {
        expect(storage.has(chunkKey)).toBe(false);
      }
      for (const pointerKey of makeStorageKeyPointerKeys('KeyringController')) {
        expect(storage.has(pointerKey)).toBe(false);
      }
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        expect(storage.has(storageKeyManifestKey)).toBe(false);
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        expect(storage.has(storageKeyListKey)).toBe(false);
      }

      const reader = setup({ localMock });
      const result = await reader.get();
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({});
    });

    it('removes legacy split state from a fresh store instance reset', async () => {
      const { localMock, storage } = createMemoryStorage({
        manifest: ['meta', 'KeyringController'],
        meta: { version: 1, storageKind: 'split' },
        KeyringController: { vault: 'vault' },
      });
      const resetStore = setup({ localMock });

      await resetStore.reset();

      expect(storage.has('manifest')).toBe(false);
      expect(storage.has('meta')).toBe(false);
      expect(storage.has('KeyringController')).toBe(false);
    });

    it('overwrites split storage with only data and meta storage keys', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      const largeValue = { blob: 'a'.repeat(600 * 1024) };

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['FirstController', { first: true }],
          ['LargeController', largeValue],
        ]),
      );
      const oldFirstControllerStorageKey = getStorageKey(
        storage,
        'FirstController',
      );
      const oldLargeControllerStorageKey = getStorageKey(
        storage,
        'LargeController',
      );
      const oldChunkKeys = getChunkKeys(storage, 'LargeController');

      await localStore.set({
        data: { KeyringController: { vault: 'new' } },
        meta: { version: 2, storageKind: 'data' },
      });

      const storageKeyManifest = getLatestStorageKeyManifest(storage);
      expect(Object.keys(storageKeyManifest.storageKeys).sort()).toStrictEqual([
        'data',
        'meta',
      ]);
      expect(storage.has('manifest')).toBe(false);
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        expect(storage.has(storageKeyListKey)).toBe(true);
      }
      expect(storage.has(oldFirstControllerStorageKey)).toBe(false);
      expect(storage.has(oldLargeControllerStorageKey)).toBe(false);
      for (const chunkKey of oldChunkKeys) {
        expect(storage.has(chunkKey)).toBe(false);
      }

      const result = await localStore.get();
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { KeyringController: { vault: 'new' } },
        meta: { version: 2, storageKind: 'data' },
      });
    });
  });

  describe('get', () => {
    it('returns null if called in a browser that does not support local storage', async () => {
      const localStore = setup({ localMock: false });
      const result = await localStore.get();
      expect(result).toBe(null);
    });

    it('returns state from the browser storage.local.get method', async () => {
      const getMock = jest.fn().mockResolvedValue(MOCK_STATE);
      const localStore = setup({ localMock: { get: getMock } });

      const result = await localStore.get();

      expect(result).toStrictEqual(MOCK_STATE);
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        expect(getMock).toHaveBeenCalledWith([storageKeyManifestKey]);
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        expect(getMock).toHaveBeenCalledWith([storageKeyListKey]);
      }
      expect(getMock).toHaveBeenCalledWith(['manifest']);
      expect(getMock).not.toHaveBeenCalledWith([CHUNK_MANIFEST_KEY]);
      expect(getMock).toHaveBeenCalledWith(['data']);
      expect(getMock).toHaveBeenCalledWith(['meta']);
    });

    it('prefers generated data storage over a stale split manifest', async () => {
      const dataStorageKey = `${STATE_STORAGE_KEY_PREFIX}data:generated`;
      const metaStorageKey = `${STATE_STORAGE_KEY_PREFIX}meta:generated`;
      const { localMock } = createMemoryStorage({
        [STORAGE_KEY_MANIFEST_KEYS[0]]: {
          version: 1,
          updatedAt: 10,
          storageKeys: {
            data: dataStorageKey,
            meta: metaStorageKey,
          },
        },
        manifest: ['meta', 'OldController'],
        meta: { version: 1, storageKind: 'split' },
        OldController: { stale: true },
        [dataStorageKey]: { KeyringController: { vault: 'new' } },
        [metaStorageKey]: { version: 2, storageKind: 'data' },
      });
      const localStore = setup({ localMock });

      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { KeyringController: { vault: 'new' } },
        meta: { version: 2, storageKind: 'data' },
      });
    });

    it('prefers generated split storage keys over a stale split manifest', async () => {
      const metaStorageKey = `${STATE_STORAGE_KEY_PREFIX}meta:generated`;
      const keyringStorageKey = `${STATE_STORAGE_KEY_PREFIX}KeyringController:generated`;
      const newControllerStorageKey = `${STATE_STORAGE_KEY_PREFIX}NewController:generated`;
      const { localMock } = createMemoryStorage({
        [STORAGE_KEY_MANIFEST_KEYS[0]]: {
          version: 1,
          updatedAt: 10,
          storageKeys: {
            meta: metaStorageKey,
            KeyringController: keyringStorageKey,
            NewController: newControllerStorageKey,
          },
        },
        manifest: ['meta', 'KeyringController'],
        meta: { version: 1, storageKind: 'split' },
        KeyringController: { vault: 'stale' },
        [metaStorageKey]: { version: 2, storageKind: 'split' },
        [keyringStorageKey]: { vault: 'new' },
        [newControllerStorageKey]: { value: 'new' },
      });
      const localStore = setup({ localMock });

      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'new' },
          NewController: { value: 'new' },
        },
        meta: { version: 2, storageKind: 'split' },
      });
    });

    it('loads split state without reading the legacy chunk manifest', async () => {
      const responses = new Map<string, Record<string, unknown>>([
        [CHUNK_MANIFEST_KEY, { [CHUNK_MANIFEST_KEY]: {} }],
        ['manifest', { manifest: ['meta', 'KeyringController'] }],
        ['meta', { meta: { version: 1, storageKind: 'split' } }],
        ['KeyringController', { KeyringController: { vault: 'vault' } }],
      ]);
      const getMock = jest.fn(async (keys: string[]) => {
        return Object.assign(
          {},
          ...keys.map((key) => responses.get(key) ?? {}),
        );
      });
      const localStore = setup({ localMock: { get: getMock } });

      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { KeyringController: { vault: 'vault' } },
        meta: { version: 1, storageKind: 'split' },
      });
      expect(getMock).not.toHaveBeenCalledWith([CHUNK_MANIFEST_KEY]);
    });

    it('continues loading split state when a noncritical manifest key is unreadable', async () => {
      const error = new Error('block checksum mismatch');
      const responses = new Map<string, Record<string, unknown>>([
        [
          'manifest',
          { manifest: ['meta', 'KeyringController', 'LargeController'] },
        ],
        ['meta', { meta: { version: 1, storageKind: 'split' } }],
        ['KeyringController', { KeyringController: { vault: 'vault' } }],
      ]);
      const getMock = jest.fn(async (keys: string[]) => {
        keys.includes('LargeController') &&
          (() => {
            throw error;
          })();
        return Object.assign(
          {},
          ...keys.map((key) => responses.get(key) ?? {}),
        );
      });
      const localStore = setup({ localMock: { get: getMock } });

      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { KeyringController: { vault: 'vault' } },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('throws when a critical manifest key is unreadable', async () => {
      const error = new Error('block checksum mismatch');
      const responses = new Map<string, Record<string, unknown>>([
        ['manifest', { manifest: ['meta', 'KeyringController'] }],
        ['meta', { meta: { version: 1, storageKind: 'split' } }],
      ]);
      const getMock = jest.fn(async (keys: string[]) => {
        keys.includes('KeyringController') &&
          (() => {
            throw error;
          })();
        return Object.assign(
          {},
          ...keys.map((key) => responses.get(key) ?? {}),
        );
      });
      const localStore = setup({ localMock: { get: getMock } });

      await expect(localStore.get()).rejects.toThrow('block checksum mismatch');
    });

    it('tags generated state value read errors for Sentry', async () => {
      const originalSentry = global.sentry;
      const captureException = jest.fn();
      global.sentry = { captureException } as typeof global.sentry;
      const dataStorageKey = `${STATE_STORAGE_KEY_PREFIX}data:generated`;
      const metaStorageKey = `${STATE_STORAGE_KEY_PREFIX}meta:generated`;
      const { localMock } = createMemoryStorage(
        {
          [STORAGE_KEY_MANIFEST_KEYS[0]]: {
            version: 1,
            updatedAt: 1,
            storageKeys: {
              data: dataStorageKey,
              meta: metaStorageKey,
            },
          },
          [metaStorageKey]: { version: 1, storageKind: 'data' },
        },
        new Set([dataStorageKey]),
      );
      const localStore = setup({ localMock });

      try {
        await expect(localStore.get()).rejects.toThrow(
          `block checksum mismatch for ${dataStorageKey}`,
        );
        expect(captureException).toHaveBeenCalledWith(
          expect.any(AggregateError),
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.storage_area': 'local',
              'persistence.storage_operation': 'read',
              'persistence.storage_key_class': 'generated-state-value',
            }),
          }),
        );
      } finally {
        global.sentry = originalSentry;
      }
    });
  });

  describe('setKeyValues', () => {
    it('serializes concurrent writes so later pointers cannot be published early', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      let inFlightSetCalls = 0;
      let maxInFlightSetCalls = 0;
      localMock.set.mockImplementation(async (values) => {
        inFlightSetCalls += 1;
        maxInFlightSetCalls = Math.max(maxInFlightSetCalls, inFlightSetCalls);
        await new Promise((resolve) => setTimeout(resolve, 0));
        for (const [key, value] of Object.entries(values)) {
          storage.set(key, value);
        }
        inFlightSetCalls -= 1;
      });

      await Promise.all([
        localStore.setKeyValues(
          new Map<string, unknown>([['KeyringController', { vault: 'first' }]]),
        ),
        localStore.setKeyValues(
          new Map<string, unknown>([
            ['KeyringController', { vault: 'second' }],
          ]),
        ),
      ]);

      const latestStorageKey = getLatestStorageKeyPointerStorageKey(
        storage,
        'KeyringController',
      );
      expect(maxInFlightSetCalls).toBe(1);
      expect(storage.get(latestStorageKey)).toStrictEqual({
        vault: 'second',
      });
    });

    it('stores large values as chunks behind a manifest key descriptor', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      const largeValue = { blob: 'a'.repeat(600 * 1024) };

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['LargeController', largeValue],
        ]),
      );

      const largeControllerStorageKey = getStorageKey(
        storage,
        'LargeController',
      );
      const storedLargeValue = storage.get(largeControllerStorageKey);
      expect(storedLargeValue).toStrictEqual(
        expect.objectContaining({
          metamaskStorageValue: 'metamask:chunked-storage-value',
          version: 1,
        }),
      );
      expect(storedLargeValue).not.toHaveProperty('blob');
      expect(storage.get('manifest')).toBeUndefined();
      expect(storage.get('LargeController')).toBeUndefined();

      const chunkKeys = getChunkKeys(storage, 'LargeController');
      expect(chunkKeys.length).toBeGreaterThan(1);
      expect(storage.has(CHUNK_MANIFEST_KEY)).toBe(false);

      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { LargeController: largeValue },
        meta: { version: 1, storageKind: 'split' },
      });
      expect(localMock.get).not.toHaveBeenCalledWith(chunkKeys);
      for (const chunkKey of chunkKeys) {
        expect(localMock.get).toHaveBeenCalledWith([chunkKey]);
      }
    });

    it('does not write a stale fixed manifest after writing generated storage metadata', async () => {
      const corruptedKeys = new Set(['manifest']);
      const { localMock, storage } = createMemoryStorage(
        {
          manifest: ['meta', 'LargeController'],
        },
        corruptedKeys,
      );
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['LargeController', { recovered: true }],
        ]),
      );

      expect(storage.get('manifest')).toStrictEqual([
        'meta',
        'LargeController',
      ]);
      expect(localMock.set).not.toHaveBeenCalledWith(
        expect.objectContaining({
          manifest: expect.anything(),
        }),
      );

      const result = await localStore.get();
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { LargeController: { recovered: true } },
        meta: { version: 1, storageKind: 'split' },
      });
      expect(localMock.get).not.toHaveBeenCalledWith(['manifest']);
    });

    it('skips a noncritical chunked value when one chunk is unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });
      const largeValue = { blob: 'a'.repeat(600 * 1024) };

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['LargeController', largeValue],
        ]),
      );
      const chunkKeys = getChunkKeys(storage, 'LargeController');
      const [corruptedChunkKey] = chunkKeys;
      corruptedKeys.add(corruptedChunkKey);

      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {},
        meta: { version: 1, storageKind: 'split' },
      });
      expect(localMock.get).toHaveBeenCalledWith([corruptedChunkKey]);
      expect(localMock.get).not.toHaveBeenCalledWith(chunkKeys);
    });

    it('writes required chunks individually when a chunk batch write fails', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      const largeValue = { blob: 'a'.repeat(600 * 1024) };
      const originalSet = localMock.set.getMockImplementation();
      localMock.set.mockImplementation(async (values) => {
        const keys = Object.keys(values);
        if (
          keys.length > 1 &&
          keys.every((key) => key.startsWith('__metamaskChunk:'))
        ) {
          throw new Error('chunk batch failed');
        }
        await originalSet?.(values);
      });

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', largeValue]]),
      );

      const chunkKeys = getChunkKeys(storage, 'LargeController');
      expect(chunkKeys.length).toBeGreaterThan(1);
      for (const chunkKey of chunkKeys) {
        expect(storage.has(chunkKey)).toBe(true);
      }

      const result = await localStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { LargeController: largeValue },
      });
    });

    it('removes obsolete chunks after replacing a chunked value', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      const largeValue = { blob: 'a'.repeat(600 * 1024) };

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', largeValue]]),
      );
      const oldStorageKey = getStorageKey(storage, 'LargeController');
      const oldChunkKeys = getChunkKeys(storage, 'LargeController');

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', { small: true }]]),
      );

      const newStorageKey = getStorageKey(storage, 'LargeController');
      expect(newStorageKey).not.toBe(oldStorageKey);
      expect(storage.get(newStorageKey)).toStrictEqual({ small: true });
      expect(storage.has(oldStorageKey)).toBe(false);
      expect(storage.has(CHUNK_MANIFEST_KEY)).toBe(false);
      for (const chunkKey of oldChunkKeys) {
        expect(storage.has(chunkKey)).toBe(false);
      }
    });

    it('removes obsolete chunks when an obsolete storage key is unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });
      const largeValue = { blob: 'a'.repeat(600 * 1024) };

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', largeValue]]),
      );
      const oldStorageKey = getStorageKey(storage, 'LargeController');
      const oldChunkKeys = getChunkKeys(storage, 'LargeController');
      corruptedKeys.add(oldStorageKey);

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', { small: true }]]),
      );

      const newStorageKey = getStorageKey(storage, 'LargeController');
      expect(storage.get(newStorageKey)).toStrictEqual({ small: true });
      expect(storage.has(oldStorageKey)).toBe(true);
      for (const chunkKey of oldChunkKeys) {
        expect(storage.has(chunkKey)).toBe(false);
      }
    });

    it('removes obsolete chunks after restart using chunk descriptors', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const largeValue = { blob: 'a'.repeat(600 * 1024) };
      const firstLocalStore = setup({ localMock });

      await firstLocalStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['LargeController', largeValue],
        ]),
      );
      const oldStorageKey = getStorageKey(storage, 'LargeController');
      const oldChunkKeys = getChunkKeys(storage, 'LargeController');
      storage.set(CHUNK_MANIFEST_KEY, {
        stale: ['__metamaskChunk:stale:0'],
      });
      corruptedKeys.add(CHUNK_MANIFEST_KEY);
      const restartedLocalStore = setup({ localMock });

      const result = await restartedLocalStore.get();
      await restartedLocalStore.setKeyValues(
        new Map<string, unknown>([['LargeController', { small: true }]]),
      );

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: { LargeController: largeValue },
        meta: { version: 1, storageKind: 'split' },
      });
      expect(storage.has(oldStorageKey)).toBe(false);
      for (const chunkKey of oldChunkKeys) {
        expect(storage.has(chunkKey)).toBe(false);
      }
      expect(localMock.get).not.toHaveBeenCalledWith([CHUNK_MANIFEST_KEY]);
    });

    it('writes to a fresh storage key when a legacy noncritical key is unreadable', async () => {
      const corruptedKeys = new Set(['LargeController']);
      const { localMock, storage } = createMemoryStorage(
        {
          manifest: ['meta', 'KeyringController', 'LargeController'],
          meta: { version: 1, storageKind: 'split' },
          KeyringController: { vault: 'vault' },
          LargeController: { stale: true },
        },
        corruptedKeys,
      );
      const localStore = setup({ localMock });

      const readResult = await localStore.get();

      expect(JSON.parse(JSON.stringify(readResult))).toStrictEqual({
        data: { KeyringController: { vault: 'vault' } },
        meta: { version: 1, storageKind: 'split' },
      });

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', { recovered: true }]]),
      );

      const storageKey = getStorageKey(storage, 'LargeController');
      expect(storageKey).not.toBe('LargeController');
      expect(storage.get(storageKey)).toStrictEqual({ recovered: true });

      const recoveredResult = await localStore.get();
      expect(JSON.parse(JSON.stringify(recoveredResult))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
          LargeController: { recovered: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('does not remove a stale fixed split key after writing generated storage metadata', async () => {
      const corruptedKeys = new Set(['LargeController']);
      const { localMock, storage } = createMemoryStorage(
        {
          manifest: ['meta', 'LargeController'],
          meta: { version: 1, storageKind: 'split' },
          LargeController: { stale: true },
        },
        corruptedKeys,
      );
      const localStore = setup({ localMock });

      await localStore.get();
      localMock.remove.mockClear();
      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', { recovered: true }]]),
      );

      const storageKey = getStorageKey(storage, 'LargeController');
      expect(storageKey).not.toBe('LargeController');
      expect(storage.get(storageKey)).toStrictEqual({ recovered: true });
      expect(storage.has('LargeController')).toBe(true);
      expect(localMock.remove).not.toHaveBeenCalledWith(
        expect.arrayContaining(['LargeController']),
      );

      const result = await localStore.get();
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          LargeController: { recovered: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('loads generated storage keys when one storage key manifest copy is unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['FirstController', { first: true }],
        ]),
      );
      await localStore.setKeyValues(
        new Map<string, unknown>([['SecondController', { second: true }]]),
      );
      corruptedKeys.add(getLatestStorageKeyManifestKey(storage));

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          FirstController: { first: true },
          SecondController: { second: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('loads generated storage keys when only one storage key manifest copy is readable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
        ]),
      );
      const latestManifestKey = getLatestStorageKeyManifestKey(storage);
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        if (storageKeyManifestKey !== latestManifestKey) {
          corruptedKeys.add(storageKeyManifestKey);
        }
      }

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('loads generated storage keys without reading a corrupt legacy manifest', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
        ]),
      );
      corruptedKeys.add('manifest');
      localMock.get.mockClear();

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(localMock.get).not.toHaveBeenCalledWith(['manifest']);
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
        },
        meta: { version: 1, storageKind: 'split' },
      });
      expect(getLatestStorageKeyManifest(storage).storageKeys).toHaveProperty(
        'KeyringController',
      );
    });

    it('loads generated split storage keys from pointers when all storage key manifest copies and the legacy manifest are unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      const keyringStorageKey = getStorageKey(storage, 'KeyringController');
      const largeControllerStorageKey = getStorageKey(
        storage,
        'LargeController',
      );
      STORAGE_KEY_MANIFEST_KEYS.forEach((storageKeyManifestKey) =>
        corruptedKeys.add(storageKeyManifestKey),
      );
      corruptedKeys.add('manifest');

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(getLatestStorageKeyList(storage).keys.sort()).toStrictEqual([
        'KeyringController',
        'LargeController',
        'meta',
      ]);
      expect(
        getLatestStorageKeyPointer(storage, 'KeyringController').storageKey,
      ).toBe(keyringStorageKey);
      expect(
        getLatestStorageKeyPointer(storage, 'LargeController').storageKey,
      ).toBe(largeControllerStorageKey);
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
          LargeController: { large: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('loads generated split storage keys when the original pointer slots are unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      STORAGE_KEY_MANIFEST_KEYS.forEach((storageKeyManifestKey) =>
        corruptedKeys.add(storageKeyManifestKey),
      );
      corruptedKeys.add('manifest');
      for (const logicalKey of [
        'meta',
        'KeyringController',
        'LargeController',
      ]) {
        for (const pointerKey of makeStorageKeyPointerKeys(logicalKey).slice(
          0,
          4,
        )) {
          corruptedKeys.add(pointerKey);
        }
      }

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
          LargeController: { large: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('persists split state changes through pointers when all storage key manifest copies and the legacy manifest are unwritable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      STORAGE_KEY_MANIFEST_KEYS.forEach((storageKeyManifestKey) =>
        corruptedKeys.add(storageKeyManifestKey),
      );
      corruptedKeys.add('manifest');

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', { recovered: true }]]),
      );

      const largeControllerPointerStorageKey =
        getLatestStorageKeyPointerStorageKey(storage, 'LargeController');
      expect(
        largeControllerPointerStorageKey.startsWith(STATE_STORAGE_KEY_PREFIX),
      ).toBe(true);
      expect(storage.get(largeControllerPointerStorageKey)).toStrictEqual({
        recovered: true,
      });
      expect(getLatestStorageKeyList(storage).keys.sort()).toStrictEqual([
        'KeyringController',
        'LargeController',
        'meta',
      ]);

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
          LargeController: { recovered: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('uses pointer tombstones to ignore deleted keys from a stale readable storage key manifest when storage key lists are missing', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      const staleManifest = getLatestStorageKeyManifest(storage);
      const staleLargeControllerStorageKey =
        staleManifest.storageKeys.LargeController;

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', undefined]]),
      );
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        storage.set(storageKeyManifestKey, staleManifest);
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.delete(storageKeyListKey);
      }
      storage.set(staleLargeControllerStorageKey, { large: true });

      expect(
        getLatestStorageKeyPointer(storage, 'LargeController').storageKey,
      ).toBeNull();

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('uses pointer tombstones to ignore deleted keys from a stale storage key list when manifests are unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      const staleKeyList = getLatestStorageKeyList(storage);

      await localStore.setKeyValues(
        new Map<string, unknown>([['LargeController', undefined]]),
      );
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        corruptedKeys.add(storageKeyManifestKey);
      }
      corruptedKeys.add('manifest');
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.set(storageKeyListKey, staleKeyList);
      }
      storage.set('meta', { version: 1, storageKind: 'split' });
      storage.set('KeyringController', { vault: 'legacy-vault' });
      storage.set('LargeController', { large: true });

      expect(
        getLatestStorageKeyPointer(storage, 'LargeController').storageKey,
      ).toBeNull();

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('does not fall back to legacy manifest or solid keys when generated metadata is unreadable and pointers are missing', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
        ]),
      );
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        corruptedKeys.add(storageKeyManifestKey);
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.delete(storageKeyListKey);
      }
      for (const logicalKey of ['data', 'meta', 'KeyringController']) {
        for (const pointerKey of makeStorageKeyPointerKeys(logicalKey)) {
          storage.delete(pointerKey);
        }
      }
      storage.set('manifest', ['meta', 'KeyringController']);
      storage.set('data', { KeyringController: { vault: 'legacy-solid' } });
      storage.set('meta', { version: 1, storageKind: 'split' });
      storage.set('KeyringController', { vault: 'legacy-vault' });

      localMock.get.mockClear();
      const reloadedStore = new ExtensionStore();

      await expect(reloadedStore.get()).rejects.toThrow(
        'MetaMask - could not recover state from generated storage metadata',
      );
      expect(localMock.get).not.toHaveBeenCalledWith(['data']);
      expect(localMock.get).not.toHaveBeenCalledWith(['meta']);
      expect(localMock.get).not.toHaveBeenCalledWith(['KeyringController']);
    });

    it('does not fall back to legacy solid keys when generated key lists are unreadable', async () => {
      const corruptedKeys = new Set<string>(STORAGE_KEY_LIST_KEYS);
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      setup({ localMock });
      storage.set('manifest', ['meta', 'KeyringController']);
      storage.set('data', { KeyringController: { vault: 'legacy-solid' } });
      storage.set('meta', { version: 1, storageKind: 'split' });
      storage.set('KeyringController', { vault: 'legacy-vault' });

      localMock.get.mockClear();
      const reloadedStore = new ExtensionStore();

      await expect(reloadedStore.get()).rejects.toThrow(
        'MetaMask - could not recover state from generated storage metadata',
      );
      expect(localMock.get).not.toHaveBeenCalledWith(['data']);
      expect(localMock.get).not.toHaveBeenCalledWith(['meta']);
      expect(localMock.get).not.toHaveBeenCalledWith(['KeyringController']);
    });

    it('uses legacy manifest pointers instead of a stale data manifest when storage key lists are unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.set({
        data: { OldController: { old: true } },
        meta: { version: 0, storageKind: 'data' },
      });
      const staleSolidManifest = getLatestStorageKeyManifest(storage);

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['data', undefined],
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
        ]),
      );
      storage.set('manifest', ['meta', 'KeyringController']);
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        storage.set(storageKeyManifestKey, staleSolidManifest);
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        corruptedKeys.add(storageKeyListKey);
      }
      storage.set('data', { OldController: { old: true } });

      localMock.get.mockClear();
      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
        },
        meta: { version: 1, storageKind: 'split' },
      });
      expect(localMock.get).not.toHaveBeenCalledWith(['data']);
    });

    it('does not read corrupt legacy manifest when generated split keys are readable and storage key lists are unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
        ]),
      );
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        corruptedKeys.add(storageKeyListKey);
      }
      corruptedKeys.add('manifest');
      storage.set('manifest', ['meta', 'KeyringController']);

      localMock.get.mockClear();
      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(localMock.get).not.toHaveBeenCalledWith(['manifest']);
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('does not read corrupt legacy manifest when generated data keys are readable and storage key lists are unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });
      const state = {
        data: { KeyringController: { vault: 'vault' } },
        meta: { version: 2, storageKind: 'data' },
      } as const;

      await localStore.set(state);
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        corruptedKeys.add(storageKeyListKey);
      }
      corruptedKeys.add('manifest');
      storage.set('manifest', ['data', 'meta']);

      localMock.get.mockClear();
      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(localMock.get).not.toHaveBeenCalledWith(['manifest']);
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(state);
    });

    it('uses pointer tombstones and solid data pointers after overwriting split state when a stale split manifest is readable and storage key lists are missing', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      const solidState = {
        data: { KeyringController: { vault: 'solid-vault' } },
        meta: { version: 2, storageKind: 'data' },
      } as const;

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'split-vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      const staleSplitManifest = getLatestStorageKeyManifest(storage);
      const staleKeyringStorageKey =
        staleSplitManifest.storageKeys.KeyringController;
      const staleLargeControllerStorageKey =
        staleSplitManifest.storageKeys.LargeController;

      await localStore.set(solidState);
      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        storage.set(storageKeyManifestKey, staleSplitManifest);
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.delete(storageKeyListKey);
      }
      storage.set(staleKeyringStorageKey, { vault: 'split-vault' });
      storage.set(staleLargeControllerStorageKey, { large: true });

      expect(
        getLatestStorageKeyPointer(storage, 'KeyringController').storageKey,
      ).toBeNull();
      expect(
        getLatestStorageKeyPointer(storage, 'LargeController').storageKey,
      ).toBeNull();

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(solidState);
    });

    it('prefers newer storage key list pointers over a stale readable storage key manifest', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      const previousManifest = getLatestStorageKeyManifest(storage);
      const newerUpdatedAt = previousManifest.updatedAt + 1;
      const newerLargeControllerStorageKey = `${STATE_STORAGE_KEY_PREFIX}LargeController:newer`;
      storage.set(newerLargeControllerStorageKey, { recovered: true });
      for (const pointerKey of makeStorageKeyPointerKeys('LargeController')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          storageKey: newerLargeControllerStorageKey,
        });
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.set(storageKeyListKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          keys: ['meta', 'KeyringController', 'LargeController'],
        });
      }

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
          LargeController: { recovered: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('prefers newer split pointers over a stale readable storage key manifest when storage key lists are missing', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });

      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
          ['LargeController', { large: true }],
        ]),
      );
      const previousManifest = getLatestStorageKeyManifest(storage);
      const newerUpdatedAt = previousManifest.updatedAt + 1;
      const newerLargeControllerStorageKey = `${STATE_STORAGE_KEY_PREFIX}LargeController:newer`;
      storage.set(newerLargeControllerStorageKey, { recovered: true });
      for (const pointerKey of makeStorageKeyPointerKeys('LargeController')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          storageKey: newerLargeControllerStorageKey,
        });
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.delete(storageKeyListKey);
      }

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual({
        data: {
          KeyringController: { vault: 'vault' },
          LargeController: { recovered: true },
        },
        meta: { version: 1, storageKind: 'split' },
      });
    });

    it('loads generated data storage keys from pointers when all storage key manifest copies are unreadable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });
      const state = {
        data: { KeyringController: { vault: 'vault' } },
        meta: { version: 2, storageKind: 'data' },
      } as const;

      await localStore.set(state);
      const dataStorageKey = getStorageKey(storage, 'data');
      const metaStorageKey = getStorageKey(storage, 'meta');
      STORAGE_KEY_MANIFEST_KEYS.forEach((storageKeyManifestKey) =>
        corruptedKeys.add(storageKeyManifestKey),
      );

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(getLatestStorageKeyPointer(storage, 'data').storageKey).toBe(
        dataStorageKey,
      );
      expect(getLatestStorageKeyPointer(storage, 'meta').storageKey).toBe(
        metaStorageKey,
      );
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(state);
    });

    it('loads generated data storage keys from pointers without reading a corrupt legacy manifest when generated root metadata is missing', async () => {
      const corruptedKeys = new Set<string>(['manifest']);
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      setup({ localMock });
      const state = {
        data: { KeyringController: { vault: 'vault' } },
        meta: { version: 2, storageKind: 'data' },
      } as const;
      const dataStorageKey = `${STATE_STORAGE_KEY_PREFIX}data:pointer-only`;
      const metaStorageKey = `${STATE_STORAGE_KEY_PREFIX}meta:pointer-only`;

      storage.set(dataStorageKey, state.data);
      storage.set(metaStorageKey, state.meta);
      for (const pointerKey of makeStorageKeyPointerKeys('data')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: 1,
          storageKey: dataStorageKey,
        });
      }
      for (const pointerKey of makeStorageKeyPointerKeys('meta')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: 1,
          storageKey: metaStorageKey,
        });
      }
      storage.set('manifest', ['data', 'meta']);
      storage.set('data', { KeyringController: { vault: 'legacy-vault' } });
      storage.set('meta', { version: 1, storageKind: 'data' });
      localMock.get.mockClear();

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(localMock.get).not.toHaveBeenCalledWith(['manifest']);
      expect(localMock.get).not.toHaveBeenCalledWith(['data']);
      expect(localMock.get).not.toHaveBeenCalledWith(['meta']);
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(state);
    });

    it('does not fall back to legacy solid keys when generated data pointers are unreadable and root metadata is missing', async () => {
      const corruptedKeys = new Set<string>([
        ...makeStorageKeyPointerKeys('data'),
        ...makeStorageKeyPointerKeys('meta'),
      ]);
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      setup({ localMock });

      storage.set('manifest', ['data', 'meta']);
      storage.set('data', { KeyringController: { vault: 'legacy-vault' } });
      storage.set('meta', { version: 1, storageKind: 'data' });
      localMock.get.mockClear();

      const reloadedStore = new ExtensionStore();

      await expect(reloadedStore.get()).rejects.toThrow(
        'MetaMask - could not recover state from generated storage metadata',
      );
      expect(localMock.get).not.toHaveBeenCalledWith(['manifest']);
      expect(localMock.get).not.toHaveBeenCalledWith(['data']);
      expect(localMock.get).not.toHaveBeenCalledWith(['meta']);
    });

    it('persists data state changes through pointers when all storage key manifest copies are unwritable', async () => {
      const corruptedKeys = new Set<string>();
      const { localMock, storage } = createMemoryStorage({}, corruptedKeys);
      const localStore = setup({ localMock });
      const initialState = {
        data: { KeyringController: { vault: 'old-vault' } },
        meta: { version: 1, storageKind: 'data' },
      } as const;
      const updatedState = {
        data: { KeyringController: { vault: 'new-vault' } },
        meta: { version: 2, storageKind: 'data' },
      } as const;

      await localStore.set(initialState);
      STORAGE_KEY_MANIFEST_KEYS.forEach((storageKeyManifestKey) =>
        corruptedKeys.add(storageKeyManifestKey),
      );

      await localStore.set(updatedState);

      const dataStorageKey = getLatestStorageKeyPointerStorageKey(
        storage,
        'data',
      );
      const metaStorageKey = getLatestStorageKeyPointerStorageKey(
        storage,
        'meta',
      );
      expect(dataStorageKey.startsWith(STATE_STORAGE_KEY_PREFIX)).toBe(true);
      expect(metaStorageKey.startsWith(STATE_STORAGE_KEY_PREFIX)).toBe(true);
      expect(getLatestStorageKeyList(storage).keys.sort()).toStrictEqual([
        'data',
        'meta',
      ]);
      expect(storage.get(dataStorageKey)).toStrictEqual(updatedState.data);
      expect(storage.get(metaStorageKey)).toStrictEqual(updatedState.meta);

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(updatedState);
    });

    it('prefers newer data pointers when the storage key list is newer than a stale readable storage key manifest', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      const initialState = {
        data: { KeyringController: { vault: 'old-vault' } },
        meta: { version: 1, storageKind: 'data' },
      } as const;
      const updatedState = {
        data: { KeyringController: { vault: 'new-vault' } },
        meta: { version: 2, storageKind: 'data' },
      } as const;

      await localStore.set(initialState);
      const previousManifest = getLatestStorageKeyManifest(storage);
      const newerUpdatedAt = previousManifest.updatedAt + 1;
      const newerDataStorageKey = `${STATE_STORAGE_KEY_PREFIX}data:newer`;
      const newerMetaStorageKey = `${STATE_STORAGE_KEY_PREFIX}meta:newer`;
      storage.set(newerDataStorageKey, updatedState.data);
      storage.set(newerMetaStorageKey, updatedState.meta);
      for (const pointerKey of makeStorageKeyPointerKeys('data')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          storageKey: newerDataStorageKey,
        });
      }
      for (const pointerKey of makeStorageKeyPointerKeys('meta')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          storageKey: newerMetaStorageKey,
        });
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.set(storageKeyListKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          keys: ['data', 'meta'],
        });
      }

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(updatedState);
    });

    it('prefers newer data pointers over a stale readable storage key manifest when storage key lists are missing', async () => {
      const { localMock, storage } = createMemoryStorage();
      const localStore = setup({ localMock });
      const initialState = {
        data: { KeyringController: { vault: 'old-vault' } },
        meta: { version: 1, storageKind: 'data' },
      } as const;
      const updatedState = {
        data: { KeyringController: { vault: 'new-vault' } },
        meta: { version: 2, storageKind: 'data' },
      } as const;

      await localStore.set(initialState);
      const previousManifest = getLatestStorageKeyManifest(storage);
      const newerUpdatedAt = previousManifest.updatedAt + 1;
      const newerDataStorageKey = `${STATE_STORAGE_KEY_PREFIX}data:newer`;
      const newerMetaStorageKey = `${STATE_STORAGE_KEY_PREFIX}meta:newer`;
      storage.set(newerDataStorageKey, updatedState.data);
      storage.set(newerMetaStorageKey, updatedState.meta);
      for (const pointerKey of makeStorageKeyPointerKeys('data')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          storageKey: newerDataStorageKey,
        });
      }
      for (const pointerKey of makeStorageKeyPointerKeys('meta')) {
        storage.set(pointerKey, {
          version: 1,
          updatedAt: newerUpdatedAt,
          storageKey: newerMetaStorageKey,
        });
      }
      for (const storageKeyListKey of STORAGE_KEY_LIST_KEYS) {
        storage.delete(storageKeyListKey);
      }

      const reloadedStore = new ExtensionStore();
      const result = await reloadedStore.get();

      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(updatedState);
    });

    it('tries every storage key manifest slot when every manifest copy was unreadable', async () => {
      const storage = new Map<string, unknown>();
      const error = new Error('block checksum mismatch');
      const successfulManifestKey = STORAGE_KEY_MANIFEST_KEYS[3];
      const failingManifestKeys = new Set<string>(
        STORAGE_KEY_MANIFEST_KEYS.filter(
          (key) => key !== successfulManifestKey,
        ),
      );
      const getMock = jest.fn(async (keys: string[]) => {
        keys.some((key) =>
          STORAGE_KEY_MANIFEST_KEYS.includes(
            key as (typeof STORAGE_KEY_MANIFEST_KEYS)[number],
          ),
        ) &&
          (() => {
            throw error;
          })();
        return Object.fromEntries(
          keys
            .filter((key) => storage.has(key))
            .map((key) => [key, storage.get(key)]),
        );
      });
      const setMock = jest.fn(async (values: Record<string, unknown>) => {
        const storageKeyManifestKey = STORAGE_KEY_MANIFEST_KEYS.find((key) =>
          Object.prototype.hasOwnProperty.call(values, key),
        );
        storageKeyManifestKey &&
          failingManifestKeys.has(storageKeyManifestKey) &&
          (() => {
            throw error;
          })();
        for (const [key, value] of Object.entries(values)) {
          storage.set(key, value);
        }
      });
      const localStore = setup({
        localMock: {
          get: getMock,
          set: setMock,
          remove: jest.fn(),
        },
      });

      await expect(localStore.get()).rejects.toThrow(
        'MetaMask - could not recover state from generated storage metadata',
      );
      await localStore.setKeyValues(
        new Map<string, unknown>([
          ['meta', { version: 1, storageKind: 'split' }],
          ['KeyringController', { vault: 'vault' }],
        ]),
      );

      for (const storageKeyManifestKey of STORAGE_KEY_MANIFEST_KEYS) {
        expect(setMock).toHaveBeenCalledWith(
          expect.objectContaining({
            [storageKeyManifestKey]: expect.any(Object),
          }),
        );
      }
      expect(storage.has(successfulManifestKey)).toBe(true);
    });
  });
});
