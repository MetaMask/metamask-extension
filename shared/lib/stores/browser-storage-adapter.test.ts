import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';

const { BrowserStorageAdapter } = jest.requireActual(
  './browser-storage-adapter',
);

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

function getMockStorageValues(
  storage: Map<string, unknown>,
  key: unknown,
): Record<string, unknown> {
  if (key === null) {
    return Object.fromEntries(storage);
  }

  if (typeof key !== 'string' || !storage.has(key)) {
    return {};
  }

  return { [key]: storage.get(key) };
}

describe('BrowserStorageAdapter', () => {
  let adapter: InstanceType<typeof BrowserStorageAdapter>;
  const mockGet = jest.mocked(browser.storage.local.get);
  const mockSet = jest.mocked(browser.storage.local.set);
  const mockRemove = jest.mocked(browser.storage.local.remove);
  const indexKey0 = `${STORAGE_KEY_PREFIX}__keyIndex:TestController:0`;
  const indexKey1 = `${STORAGE_KEY_PREFIX}__keyIndex:TestController:1`;
  const indexKey2 = `${STORAGE_KEY_PREFIX}__keyIndex:TestController:2`;
  const indexKey3 = `${STORAGE_KEY_PREFIX}__keyIndex:TestController:3`;
  const keyListKey0 = `${STORAGE_KEY_PREFIX}__keyList:TestController:0`;
  const keyListKey1 = `${STORAGE_KEY_PREFIX}__keyList:TestController:1`;
  const keyListKey2 = `${STORAGE_KEY_PREFIX}__keyList:TestController:2`;
  const keyListKey3 = `${STORAGE_KEY_PREFIX}__keyList:TestController:3`;
  const valueKeyPrefix = `${STORAGE_KEY_PREFIX}__value:TestController:myKey:`;
  const pointerKey0 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:0`;
  const pointerKey1 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:1`;
  const pointerKey2 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:2`;
  const pointerKey3 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:3`;
  const pointerKey4 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:4`;
  const pointerKey5 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:5`;
  const pointerKey6 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:6`;
  const pointerKey7 = `${STORAGE_KEY_PREFIX}__valuePointer:TestController:myKey:7`;
  const pointerKeys = [
    pointerKey0,
    pointerKey1,
    pointerKey2,
    pointerKey3,
    pointerKey4,
    pointerKey5,
    pointerKey6,
    pointerKey7,
  ];
  const namespaceClearKey0 = `${STORAGE_KEY_PREFIX}__namespaceClear:TestController:0`;
  const namespaceClearKey1 = `${STORAGE_KEY_PREFIX}__namespaceClear:TestController:1`;
  const namespaceClearKey2 = `${STORAGE_KEY_PREFIX}__namespaceClear:TestController:2`;
  const namespaceClearKey3 = `${STORAGE_KEY_PREFIX}__namespaceClear:TestController:3`;
  const namespaceClearKeys = [
    namespaceClearKey0,
    namespaceClearKey1,
    namespaceClearKey2,
    namespaceClearKey3,
  ];

  const getNamespaceClearMarkerExpectation = () =>
    Object.fromEntries(
      namespaceClearKeys.map((namespaceClearKey) => [
        namespaceClearKey,
        expect.objectContaining({ version: 1 }),
      ]),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    adapter = new BrowserStorageAdapter();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getItem', () => {
    it('returns { result } when key exists', async () => {
      const fullKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      mockGet.mockResolvedValue({ [fullKey]: { data: 'test' } });

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(fullKey);
      expect(result).toStrictEqual({ result: { data: 'test' } });
    });

    it('returns { result } from a generated storage key', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: storageKey },
            },
          };
        }
        if (key === storageKey) {
          return { [storageKey]: { data: 'test' } };
        }
        return {};
      });

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(storageKey);
      expect(result).toStrictEqual({ result: { data: 'test' } });
    });

    it('does not fall back to legacy keys in generated-only mode', async () => {
      const fullKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      mockGet.mockImplementation(async (key) => {
        if (key === fullKey) {
          return { [fullKey]: { data: 'legacy' } };
        }
        return {};
      });

      const result = await adapter.getGeneratedItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(fullKey);
    });

    it('returns { result } when only one index copy is readable', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[indexKey0, indexKey1, indexKey2].map(
          (indexKey) =>
            [
              indexKey,
              async () => {
                throw new Error(`block checksum mismatch for ${indexKey}`);
              },
            ] as const,
        ),
        [
          indexKey3,
          async () => ({
            [indexKey3]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: storageKey },
            },
          }),
        ],
        [storageKey, async () => ({ [storageKey]: { data: 'test' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(storageKey);
      expect(result).toStrictEqual({ result: { data: 'test' } });
    });

    it('returns { result } from a pointer when every index copy is unreadable', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[indexKey0, indexKey1, indexKey2, indexKey3].map(
          (indexKey) =>
            [
              indexKey,
              async () => {
                throw new Error(`block checksum mismatch for ${indexKey}`);
              },
            ] as const,
        ),
        [
          pointerKey0,
          async () => ({
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey,
            },
          }),
        ],
        [pointerKey1, async () => ({})],
        [storageKey, async () => ({ [storageKey]: { data: 'test' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(storageKey);
      expect(result).toStrictEqual({ result: { data: 'test' } });
    });

    it('returns { result } from a later pointer when the original pointer slots are unreadable', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[indexKey0, indexKey1, indexKey2, indexKey3].map(
          (indexKey) =>
            [
              indexKey,
              async () => {
                throw new Error(`block checksum mismatch for ${indexKey}`);
              },
            ] as const,
        ),
        ...pointerKeys.slice(0, 4).map(
          (pointerKey) =>
            [
              pointerKey,
              async () => {
                throw new Error(`block checksum mismatch for ${pointerKey}`);
              },
            ] as const,
        ),
        [
          pointerKey4,
          async () => ({
            [pointerKey4]: {
              version: 1,
              updatedAt: 2,
              storageKey,
            },
          }),
        ],
        [storageKey, async () => ({ [storageKey]: { data: 'test' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(storageKey);
      expect(result).toStrictEqual({ result: { data: 'test' } });
    });

    it('returns { result } from a newer pointer instead of a stale readable index', async () => {
      const staleStorageKey = `${valueKeyPrefix}stale`;
      const storageKey = `${valueKeyPrefix}new`;
      const getResponses = new Map<unknown, Record<string, unknown>>([
        [
          indexKey0,
          {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: staleStorageKey },
            },
          },
        ],
        [
          pointerKey0,
          {
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey,
            },
          },
        ],
        [storageKey, { [storageKey]: { data: 'new' } }],
        [staleStorageKey, { [staleStorageKey]: { data: 'stale' } }],
      ]);
      mockGet.mockImplementation(async (key) => getResponses.get(key) ?? {});

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(storageKey);
      expect(mockGet).not.toHaveBeenCalledWith(staleStorageKey);
      expect(result).toStrictEqual({ result: { data: 'new' } });
    });

    it('returns {} from a deletion pointer instead of stale legacy storage', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const getResponses = new Map<unknown, Record<string, unknown>>([
        [
          pointerKey0,
          {
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey: null,
            },
          },
        ],
        [legacyKey, { [legacyKey]: { data: 'stale' } }],
      ]);
      mockGet.mockImplementation(async (key) => getResponses.get(key) ?? {});

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
    });

    it('returns {} from a newer deletion pointer instead of a stale readable index', async () => {
      const staleStorageKey = `${valueKeyPrefix}stale`;
      const getResponses = new Map<unknown, Record<string, unknown>>([
        [
          indexKey0,
          {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: staleStorageKey },
            },
          },
        ],
        [
          pointerKey0,
          {
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey: null,
            },
          },
        ],
        [staleStorageKey, { [staleStorageKey]: { data: 'stale' } }],
      ]);
      mockGet.mockImplementation(async (key) => getResponses.get(key) ?? {});

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(staleStorageKey);
    });

    it('returns {} from a namespace clear marker instead of stale pointer storage', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[indexKey0, indexKey1, indexKey2, indexKey3].map(
          (indexKey) =>
            [
              indexKey,
              async () => {
                throw new Error(`block checksum mismatch for ${indexKey}`);
              },
            ] as const,
        ),
        [
          pointerKey0,
          async () => ({
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey,
            },
          }),
        ],
        [pointerKey1, async () => ({})],
        [
          namespaceClearKey0,
          async () => ({
            [namespaceClearKey0]: {
              version: 1,
              updatedAt: 3,
            },
          }),
        ],
        [namespaceClearKey1, async () => ({})],
        [legacyKey, async () => ({ [legacyKey]: { data: 'stale' } })],
        [storageKey, async () => ({ [storageKey]: { data: 'stale' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
      expect(mockGet).not.toHaveBeenCalledWith(storageKey);
    });

    it('returns {} from a newer namespace clear marker instead of a stale readable index', async () => {
      const staleStorageKey = `${valueKeyPrefix}stale`;
      const getResponses = new Map<unknown, Record<string, unknown>>([
        [
          indexKey0,
          {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: staleStorageKey },
            },
          },
        ],
        [
          namespaceClearKey0,
          {
            [namespaceClearKey0]: {
              version: 1,
              updatedAt: 2,
            },
          },
        ],
        [staleStorageKey, { [staleStorageKey]: { data: 'stale' } }],
      ]);
      mockGet.mockImplementation(async (key) => getResponses.get(key) ?? {});

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(staleStorageKey);
    });

    it('returns { result } from a pointer newer than the namespace clear marker', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      const getResponses = new Map<unknown, Record<string, unknown>>([
        [
          pointerKey0,
          {
            [pointerKey0]: {
              version: 1,
              updatedAt: 4,
              storageKey,
            },
          },
        ],
        [
          namespaceClearKey0,
          {
            [namespaceClearKey0]: {
              version: 1,
              updatedAt: 3,
            },
          },
        ],
        [storageKey, { [storageKey]: { data: 'new' } }],
      ]);
      mockGet.mockImplementation(async (key) => getResponses.get(key) ?? {});

      const result = await adapter.getItem('TestController', 'myKey');

      expect(mockGet).toHaveBeenCalledWith(storageKey);
      expect(result).toStrictEqual({ result: { data: 'new' } });
    });

    it('returns {} when key does not exist', async () => {
      mockGet.mockResolvedValue({});

      const result = await adapter.getItem('TestController', 'nonExistent');

      expect(result).toStrictEqual({});
    });

    it('does not return a stale legacy value when a generated namespace index exists without the key', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const getResponses = new Map<unknown, Record<string, unknown>>([
        [
          indexKey0,
          {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: {},
            },
          },
        ],
        [legacyKey, { [legacyKey]: { data: 'stale' } }],
      ]);
      mockGet.mockImplementation(async (key) => getResponses.get(key) ?? {});

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not read a stale legacy value when every namespace index copy is unreadable', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[indexKey0, indexKey1, indexKey2, indexKey3].map(
          (indexKey) =>
            [
              indexKey,
              async () => {
                throw new Error(`block checksum mismatch for ${indexKey}`);
              },
            ] as const,
        ),
        [legacyKey, async () => ({ [legacyKey]: { data: 'stale' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not read a stale legacy value when every namespace key-list copy is unreadable', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[keyListKey0, keyListKey1, keyListKey2, keyListKey3].map(
          (keyListKey) =>
            [
              keyListKey,
              async () => {
                throw new Error(`block checksum mismatch for ${keyListKey}`);
              },
            ] as const,
        ),
        [legacyKey, async () => ({ [legacyKey]: { data: 'stale' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not read a stale legacy value when a generated pointer copy is unreadable', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        [
          pointerKey0,
          async () => {
            throw new Error(`block checksum mismatch for ${pointerKey0}`);
          },
        ],
        [legacyKey, async () => ({ [legacyKey]: { data: 'stale' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not read a stale legacy value when a namespace clear marker copy is unreadable', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        [
          namespaceClearKey0,
          async () => {
            throw new Error(
              `block checksum mismatch for ${namespaceClearKey0}`,
            );
          },
        ],
        [legacyKey, async () => ({ [legacyKey]: { data: 'stale' } })],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('keeps legacy values hidden after a namespace clear even if a newer index exists without the key', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const otherStorageKey = `${STORAGE_KEY_PREFIX}__value:TestController:otherKey:generated`;
      const getResponses = new Map<unknown, Record<string, unknown>>([
        [
          indexKey0,
          {
            [indexKey0]: {
              version: 1,
              updatedAt: 3,
              keys: { otherKey: otherStorageKey },
            },
          },
        ],
        [
          namespaceClearKey0,
          {
            [namespaceClearKey0]: {
              version: 1,
              updatedAt: 2,
            },
          },
        ],
        [legacyKey, { [legacyKey]: { data: 'stale' } }],
      ]);
      mockGet.mockImplementation(async (key) => getResponses.get(key) ?? {});

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(legacyKey);
    });

    it('returns { error } on failure', async () => {
      const error = new Error('Storage error');
      const fullKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      mockGet.mockImplementation(async (key) => {
        if (key === fullKey) {
          throw error;
        }
        return {};
      });

      const result = await adapter.getItem('TestController', 'myKey');

      expect(result).toStrictEqual({ error });
    });
  });

  describe('hasGeneratedNamespaceState', () => {
    it('returns true when a generated pointer copy is unreadable', async () => {
      mockGet.mockImplementation(async (key) => {
        if (key === pointerKey0) {
          throw new Error(`block checksum mismatch for ${pointerKey0}`);
        }
        return {};
      });

      const result = await adapter.hasGeneratedNamespaceState(
        'TestController',
        ['myKey'],
      );

      expect(result).toBe(true);
    });

    it('returns true when a namespace clear marker copy is unreadable', async () => {
      mockGet.mockImplementation(async (key) => {
        if (key === namespaceClearKey0) {
          throw new Error(`block checksum mismatch for ${namespaceClearKey0}`);
        }
        return {};
      });

      const result = await adapter.hasGeneratedNamespaceState('TestController');

      expect(result).toBe(true);
    });
  });

  describe('setItem', () => {
    it('stores the value with a generated key and mirrored namespace index', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      mockSet.mockResolvedValue(undefined);
      mockGet.mockResolvedValue({});
      mockRemove.mockResolvedValue(undefined);

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      const write = mockSet.mock.calls[0][0] as Record<string, unknown>;
      const storageKey = Object.keys(write).find((key) =>
        key.startsWith(valueKeyPrefix),
      );
      expect(storageKey).toBeDefined();
      expect(write[storageKey as string]).toStrictEqual({ data: 'test' });
      expect(write[indexKey0]).toStrictEqual(
        expect.objectContaining({
          version: 1,
          keys: { myKey: storageKey },
        }),
      );
      for (const indexKey of [indexKey1, indexKey2, indexKey3]) {
        expect(mockSet).toHaveBeenCalledWith({
          [indexKey]: expect.objectContaining({
            version: 1,
            keys: { myKey: storageKey },
          }),
        });
      }
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [pointerKey0]: expect.objectContaining({
            version: 1,
            storageKey,
          }),
          [pointerKey1]: expect.objectContaining({
            version: 1,
            storageKey,
          }),
        }),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
      });
      expect(write).not.toHaveProperty(legacyKey);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('stores the value when only one index copy is writable', async () => {
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >(
        [indexKey0, indexKey1, indexKey2].map((indexKey) => [
          indexKey,
          async () => {
            throw new Error(`block checksum mismatch for ${indexKey}`);
          },
        ]),
      );
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );
      mockSet.mockResolvedValue(undefined);
      mockRemove.mockResolvedValue(undefined);

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      const write = mockSet.mock.calls[0][0] as Record<string, unknown>;
      expect(write).toHaveProperty(indexKey3);
      expect(write).not.toHaveProperty(indexKey0);
      expect(write).not.toHaveProperty(indexKey1);
      expect(write).not.toHaveProperty(indexKey2);
      expect(
        Object.keys(write).some((key) => key.startsWith(valueKeyPrefix)),
      ).toBe(true);
    });

    it('stores the value using pointers when every index copy is unwritable', async () => {
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >(
        [indexKey0, indexKey1, indexKey2, indexKey3].map((indexKey) => [
          indexKey,
          async () => {
            throw new Error(`block checksum mismatch for ${indexKey}`);
          },
        ]),
      );
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );
      mockSet.mockImplementation(async (value) => {
        const keys = Object.keys(value);
        if (
          [indexKey0, indexKey1, indexKey2, indexKey3].some((indexKey) =>
            keys.includes(indexKey),
          )
        ) {
          throw new Error('block checksum mismatch for index');
        }
      });
      mockRemove.mockResolvedValue(undefined);

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      const valueOnlyWrite = mockSet.mock.calls.find(([value]) => {
        const keys = Object.keys(value);
        return keys.length === 1 && keys[0].startsWith(valueKeyPrefix);
      })?.[0] as Record<string, unknown> | undefined;
      const storageKey = valueOnlyWrite
        ? Object.keys(valueOnlyWrite)[0]
        : undefined;

      expect(storageKey).toBeDefined();
      expect(valueOnlyWrite?.[storageKey as string]).toStrictEqual({
        data: 'test',
      });
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [pointerKey0]: expect.objectContaining({
            version: 1,
            storageKey,
          }),
          [pointerKey1]: expect.objectContaining({
            version: 1,
            storageKey,
          }),
        }),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
      });
    });

    it('does not rewrite the previous storage key', async () => {
      const previousStorageKey = `${valueKeyPrefix}previous`;
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: previousStorageKey },
            },
          };
        }
        return {};
      });
      mockSet.mockResolvedValue(undefined);
      mockRemove.mockResolvedValue(undefined);

      await adapter.setItem('TestController', 'myKey', { data: 'test' });

      const write = mockSet.mock.calls[0][0] as Record<string, unknown>;
      expect(write).not.toHaveProperty(previousStorageKey);
      expect(mockRemove).toHaveBeenCalledWith(previousStorageKey);
    });

    it('does not scan legacy namespace keys when creating the namespace index', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const otherLegacyKey = `${STORAGE_KEY_PREFIX}TestController:otherKey`;
      const storage = new Map<string, unknown>([
        [legacyKey, { data: 'old' }],
        [otherLegacyKey, { data: 'other' }],
      ]);
      mockGet.mockImplementation(async (key) => {
        if (key === null) {
          throw new Error('block checksum mismatch');
        }
        return getMockStorageValues(storage, key);
      });
      mockSet.mockImplementation(async (values) => {
        for (const [storageKey, value] of Object.entries(values)) {
          storage.set(storageKey, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKey of keysToRemove) {
          storage.delete(storageKey);
        }
      });

      await adapter.setItem('TestController', 'myKey', { data: 'new' });

      const write = mockSet.mock.calls[0][0] as Record<string, unknown>;
      const storageKey = Object.keys(write).find((key) =>
        key.startsWith(valueKeyPrefix),
      );
      expect(storageKey).toBeDefined();
      expect(write[indexKey0]).toStrictEqual(
        expect.objectContaining({
          version: 1,
          keys: {
            myKey: storageKey,
          },
        }),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: ['myKey'],
        }),
      });
      expect(mockGet).not.toHaveBeenCalledWith(null);
      expect(storage.has(legacyKey)).toBe(true);
      expect(storage.has(otherLegacyKey)).toBe(true);
    });

    it('hides unindexed legacy siblings after creating the namespace index without enumeration', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const otherLegacyKey = `${STORAGE_KEY_PREFIX}TestController:otherKey`;
      const storage = new Map<string, unknown>([
        [legacyKey, { data: 'old' }],
        [otherLegacyKey, { data: 'other' }],
      ]);
      mockGet.mockImplementation(async (key) => {
        if (key === null) {
          throw new Error('block checksum mismatch');
        }
        return getMockStorageValues(storage, key);
      });
      mockSet.mockImplementation(async (values) => {
        for (const [storageKey, value] of Object.entries(values)) {
          storage.set(storageKey, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKey of keysToRemove) {
          storage.delete(storageKey);
        }
      });

      await adapter.setItem('TestController', 'myKey', { data: 'new' });

      expect(mockGet).not.toHaveBeenCalledWith(null);
      expect(storage.has(legacyKey)).toBe(true);
      expect(storage.has(otherLegacyKey)).toBe(true);

      mockGet.mockClear();
      const result = await adapter.getItem('TestController', 'otherKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('serializes concurrent namespace writes so the namespace index keeps every key', async () => {
      const storage = new Map<string, unknown>();
      mockGet.mockImplementation(async (key) =>
        getMockStorageValues(storage, key),
      );
      mockSet.mockImplementation(async (values) => {
        for (const [storageKey, value] of Object.entries(values)) {
          storage.set(storageKey, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKey of keysToRemove) {
          storage.delete(storageKey);
        }
      });

      await Promise.all([
        adapter.setItem('TestController', 'firstKey', { data: 'first' }),
        adapter.setItem('TestController', 'secondKey', { data: 'second' }),
      ]);

      expect(storage.get(indexKey0)).toStrictEqual(
        expect.objectContaining({
          version: 1,
          keys: {
            firstKey: expect.stringContaining(
              `${STORAGE_KEY_PREFIX}__value:TestController:firstKey:`,
            ),
            secondKey: expect.stringContaining(
              `${STORAGE_KEY_PREFIX}__value:TestController:secondKey:`,
            ),
          },
        }),
      );
      expect(storage.get(keyListKey0)).toStrictEqual(
        expect.objectContaining({
          version: 1,
          keys: ['firstKey', 'secondKey'],
        }),
      );
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
    it('tombstones a legacy-only item without removing the fixed storage key', async () => {
      mockGet.mockResolvedValue({});
      mockRemove.mockResolvedValue(undefined);

      await adapter.removeItem('TestController', 'myKey');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [pointerKey0]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
          [pointerKey1]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
        }),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
      });
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('removes the generated storage key and updates the namespace index', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: storageKey },
            },
          };
        }
        return {};
      });
      mockSet.mockResolvedValue(undefined);
      mockRemove.mockResolvedValue(undefined);

      await adapter.removeItem('TestController', 'myKey');

      expect(mockSet).toHaveBeenCalledWith({
        [indexKey0]: expect.objectContaining({
          version: 1,
          keys: {},
        }),
      });
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [pointerKey0]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
          [pointerKey1]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
        }),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
      });
      expect(mockRemove).toHaveBeenCalledWith(storageKey);
    });

    it('does not scan legacy namespace keys when removing a legacy key', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:myKey`;
      const otherLegacyKey = `${STORAGE_KEY_PREFIX}TestController:otherKey`;
      const storage = new Map<string, unknown>([
        [legacyKey, { data: 'old' }],
        [otherLegacyKey, { data: 'other' }],
      ]);
      mockGet.mockImplementation(async (key) => {
        if (key === null) {
          throw new Error('block checksum mismatch');
        }
        return getMockStorageValues(storage, key);
      });
      mockSet.mockImplementation(async (values) => {
        for (const [storageKey, value] of Object.entries(values)) {
          storage.set(storageKey, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKey of keysToRemove) {
          storage.delete(storageKey);
        }
      });

      await adapter.removeItem('TestController', 'myKey');

      expect(mockSet).toHaveBeenCalledWith({
        [indexKey0]: expect.objectContaining({
          version: 1,
          keys: {},
        }),
      });
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
      });
      expect(mockGet).not.toHaveBeenCalledWith(null);
      expect(mockRemove).not.toHaveBeenCalled();
      expect(storage.has(legacyKey)).toBe(true);
      expect(storage.has(otherLegacyKey)).toBe(true);

      mockGet.mockClear();
      const result = await adapter.getItem('TestController', 'otherKey');

      expect(result).toStrictEqual({});
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not throw when removal fails', async () => {
      const error = new Error('Storage error');
      const storageKey = `${valueKeyPrefix}generated`;
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: storageKey },
            },
          };
        }
        return {};
      });
      mockRemove.mockRejectedValue(error);

      await adapter.removeItem('TestController', 'myKey');

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllKeys', () => {
    it('returns indexed keys for the namespace', async () => {
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: {
                key1: `${STORAGE_KEY_PREFIX}__value:TestController:key1:one`,
                key2: `${STORAGE_KEY_PREFIX}__value:TestController:key2:two`,
              },
            },
          };
        }
        return {};
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual(['key1', 'key2']);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('returns key-list keys when the key list is newer than a stale readable index', async () => {
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: {
                oldKey: `${STORAGE_KEY_PREFIX}__value:TestController:oldKey:one`,
              },
            },
          };
        }
        if (key === keyListKey0) {
          return {
            [keyListKey0]: {
              version: 1,
              updatedAt: 2,
              keys: ['newKey'],
            },
          };
        }
        return {};
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual(['newKey']);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('returns key-list keys when every namespace index copy is unreadable', async () => {
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[indexKey0, indexKey1, indexKey2, indexKey3].map(
          (indexKey) =>
            [
              indexKey,
              async () => {
                throw new Error(`block checksum mismatch for ${indexKey}`);
              },
            ] as const,
        ),
        [
          keyListKey0,
          async () => ({
            [keyListKey0]: {
              version: 1,
              updatedAt: 2,
              keys: ['newKey'],
            },
          }),
        ],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual(['newKey']);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('filters stale key-list keys using newer deletion pointers', async () => {
      mockGet.mockImplementation(async (key) => {
        if (key === keyListKey0) {
          return {
            [keyListKey0]: {
              version: 1,
              updatedAt: 1,
              keys: ['myKey', 'otherKey'],
            },
          };
        }
        if (key === pointerKey0) {
          return {
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey: null,
            },
          };
        }
        return {};
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual(['otherKey']);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('returns empty keys from a namespace clear marker newer than a stale readable index', async () => {
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: {
                oldKey: `${STORAGE_KEY_PREFIX}__value:TestController:oldKey:one`,
              },
            },
          };
        }
        if (key === namespaceClearKey0) {
          return {
            [namespaceClearKey0]: {
              version: 1,
              updatedAt: 2,
            },
          };
        }
        return {};
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not enumerate unindexed legacy keys', async () => {
      mockGet.mockResolvedValue({
        [`${STORAGE_KEY_PREFIX}TestController:key1`]: 'value1',
        [`${STORAGE_KEY_PREFIX}TestController:key2`]: 'value2',
        [`${STORAGE_KEY_PREFIX}OtherController:key3`]: 'value3',
        unrelatedKey: 'value4',
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('returns empty array when no keys exist', async () => {
      mockGet.mockResolvedValue({});

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('returns empty indexed keys without scanning legacy storage', async () => {
      mockGet.mockImplementation(async (key) => {
        return key === indexKey0
          ? {
              [indexKey0]: {
                version: 1,
                updatedAt: 1,
                keys: {},
              },
            }
          : {};
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('filters stale indexed keys using newer deletion pointers', async () => {
      const staleStorageKey = `${valueKeyPrefix}stale`;
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: {
                myKey: staleStorageKey,
                otherKey: `${valueKeyPrefix}other`,
              },
            },
          };
        }
        if (key === pointerKey0) {
          return {
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey: null,
            },
          };
        }
        return {};
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual(['otherKey']);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('returns empty keys from a namespace clear marker without scanning legacy storage', async () => {
      mockGet.mockImplementation(async (key) => {
        if (key === namespaceClearKey0) {
          return {
            [namespaceClearKey0]: {
              version: 1,
              updatedAt: 1,
            },
          };
        }
        return {};
      });

      const keys = await adapter.getAllKeys('TestController');

      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('returns an empty array on failure', async () => {
      const error = new Error('Storage error');
      mockGet.mockRejectedValue(error);

      expect(await adapter.getAllKeys('TestController')).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });
  });

  describe('clear', () => {
    it('hides unindexed legacy keys without scanning legacy storage', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:key1`;
      const storage = new Map<string, unknown>([
        [legacyKey, { data: 'legacy' }],
      ]);
      mockGet.mockImplementation(async (key) => {
        if (key === null) {
          throw new Error('block checksum mismatch');
        }
        return getMockStorageValues(storage, key);
      });
      mockSet.mockImplementation(async (values) => {
        for (const [storageKey, value] of Object.entries(values)) {
          storage.set(storageKey, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKey of keysToRemove) {
          storage.delete(storageKey);
        }
      });

      await adapter.clear('TestController');

      const result = await adapter.getItem('TestController', 'key1');
      const keys = await adapter.getAllKeys('TestController');

      expect(storage.has(legacyKey)).toBe(true);
      expect(result).toStrictEqual({});
      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('keeps unindexed legacy keys hidden when the original clear marker slots are unreadable', async () => {
      const legacyKey = `${STORAGE_KEY_PREFIX}TestController:key1`;
      const storage = new Map<string, unknown>([
        [legacyKey, { data: 'legacy' }],
      ]);
      mockGet.mockImplementation(async (key) => {
        if (key === null) {
          throw new Error('block checksum mismatch');
        }
        return getMockStorageValues(storage, key);
      });
      mockSet.mockImplementation(async (values) => {
        for (const [storageKey, value] of Object.entries(values)) {
          storage.set(storageKey, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKey of keysToRemove) {
          storage.delete(storageKey);
        }
      });

      await adapter.clear('TestController');
      storage.delete(namespaceClearKey0);
      storage.delete(namespaceClearKey1);

      const result = await adapter.getItem('TestController', 'key1');
      const keys = await adapter.getAllKeys('TestController');

      expect(storage.has(legacyKey)).toBe(true);
      expect(result).toStrictEqual({});
      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not call remove when no keys exist', async () => {
      mockGet.mockResolvedValue({});

      await adapter.clear('TestController');

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('clears an empty indexed namespace without scanning legacy storage', async () => {
      mockGet.mockImplementation(async (key) => {
        return key === indexKey0
          ? {
              [indexKey0]: {
                version: 1,
                updatedAt: 1,
                keys: {},
              },
            }
          : {};
      });
      mockSet.mockResolvedValue(undefined);

      await adapter.clear('TestController');

      expect(mockGet).not.toHaveBeenCalledWith(null);
      expect(mockSet).toHaveBeenCalledWith({
        [indexKey0]: expect.objectContaining({
          version: 1,
          keys: {},
        }),
      });
      expect(mockSet).toHaveBeenCalledWith(
        getNamespaceClearMarkerExpectation(),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
      });
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('writes a namespace clear marker when every index copy is unwritable', async () => {
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >(
        [indexKey0, indexKey1, indexKey2, indexKey3].map((indexKey) => [
          indexKey,
          async () => {
            throw new Error(`block checksum mismatch for ${indexKey}`);
          },
        ]),
      );
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );
      mockSet.mockImplementation(async (value) => {
        const keys = Object.keys(value);
        if (
          [indexKey0, indexKey1, indexKey2, indexKey3].some((indexKey) =>
            keys.includes(indexKey),
          )
        ) {
          throw new Error('block checksum mismatch for index');
        }
      });
      mockRemove.mockResolvedValue(undefined);

      await adapter.clear('TestController');

      expect(mockSet).toHaveBeenCalledWith(
        getNamespaceClearMarkerExpectation(),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
      });
    });

    it('clears key-list keys without scanning legacy storage when every namespace index copy is unreadable', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      const getResponses = new Map<
        unknown,
        () => Promise<Record<string, unknown>>
      >([
        ...[indexKey0, indexKey1, indexKey2, indexKey3].map(
          (indexKey) =>
            [
              indexKey,
              async () => {
                throw new Error(`block checksum mismatch for ${indexKey}`);
              },
            ] as const,
        ),
        [
          keyListKey0,
          async () => ({
            [keyListKey0]: {
              version: 1,
              updatedAt: 2,
              keys: ['myKey'],
            },
          }),
        ],
        [
          pointerKey0,
          async () => ({
            [pointerKey0]: {
              version: 1,
              updatedAt: 2,
              storageKey,
            },
          }),
        ],
      ]);
      mockGet.mockImplementation(async (key) =>
        (getResponses.get(key) ?? (async () => ({})))(),
      );
      mockSet.mockImplementation(async (value) => {
        const keys = Object.keys(value);
        if (
          [indexKey0, indexKey1, indexKey2, indexKey3].some((indexKey) =>
            keys.includes(indexKey),
          )
        ) {
          throw new Error('block checksum mismatch for index');
        }
      });
      mockRemove.mockResolvedValue(undefined);

      await adapter.clear('TestController');

      expect(mockGet).not.toHaveBeenCalledWith(null);
      expect(mockSet).toHaveBeenCalledWith(
        getNamespaceClearMarkerExpectation(),
      );
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
      });
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [pointerKey0]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
          [pointerKey1]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
        }),
      );
      expect(mockRemove).toHaveBeenCalledWith(storageKey);
    });

    it('clears indexed keys and the namespace index', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: storageKey },
            },
          };
        }
        return {};
      });
      mockSet.mockResolvedValue(undefined);
      mockRemove.mockResolvedValue(undefined);

      await adapter.clear('TestController');

      expect(mockSet).toHaveBeenCalledWith({
        [indexKey0]: expect.objectContaining({
          version: 1,
          keys: {},
        }),
      });
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [pointerKey0]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
          [pointerKey1]: expect.objectContaining({
            version: 1,
            storageKey: null,
          }),
        }),
      );
      expect(mockRemove).toHaveBeenCalledWith(storageKey);
      expect(mockSet).toHaveBeenCalledWith({
        [keyListKey0]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey1]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey2]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
        [keyListKey3]: expect.objectContaining({
          version: 1,
          keys: [],
        }),
      });
    });

    it('keeps cleared indexed keys deleted if clear markers are unavailable and a stale index survives', async () => {
      const storage = new Map<string, unknown>();
      const storageKey = `${valueKeyPrefix}generated`;
      const staleIndex = {
        version: 1,
        updatedAt: 1,
        keys: { myKey: storageKey },
      };
      storage.set(indexKey0, staleIndex);
      storage.set(storageKey, { data: 'stale' });
      mockGet.mockImplementation(async (key) =>
        getMockStorageValues(storage, key),
      );
      mockSet.mockImplementation(async (values) => {
        for (const [storageKeyToSet, value] of Object.entries(values)) {
          storage.set(storageKeyToSet, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKeyToRemove of keysToRemove) {
          storage.delete(storageKeyToRemove);
        }
      });

      await adapter.clear('TestController');
      storage.set(indexKey0, staleIndex);
      for (const key of [
        indexKey1,
        indexKey2,
        indexKey3,
        ...namespaceClearKeys,
      ]) {
        storage.delete(key);
      }
      storage.set(storageKey, { data: 'stale' });

      const getCallsBeforeRead = mockGet.mock.calls.length;
      const result = await adapter.getItem('TestController', 'myKey');
      const getCallsAfterRead = mockGet.mock.calls
        .slice(getCallsBeforeRead)
        .map(([key]) => key);

      expect(result).toStrictEqual({});
      expect(getCallsAfterRead).not.toContain(storageKey);
    });

    it('keeps hidden legacy keys unreadable after clear without scanning legacy storage', async () => {
      const storage = new Map<string, unknown>();
      const indexedStorageKey = `${valueKeyPrefix}generated`;
      const hiddenLegacyKey = `${STORAGE_KEY_PREFIX}TestController:hiddenKey`;
      storage.set(indexKey0, {
        version: 1,
        updatedAt: 1,
        keys: { myKey: indexedStorageKey },
      });
      storage.set(indexedStorageKey, { data: 'indexed' });
      storage.set(hiddenLegacyKey, { data: 'hidden' });
      mockGet.mockImplementation(async (key) =>
        getMockStorageValues(storage, key),
      );
      mockSet.mockImplementation(async (values) => {
        for (const [storageKeyToSet, value] of Object.entries(values)) {
          storage.set(storageKeyToSet, value);
        }
      });
      mockRemove.mockImplementation(async (keys) => {
        const keysToRemove = Array.isArray(keys) ? keys : [keys];
        for (const storageKeyToRemove of keysToRemove) {
          storage.delete(storageKeyToRemove);
        }
      });

      await adapter.clear('TestController');

      const result = await adapter.getItem('TestController', 'hiddenKey');
      const keys = await adapter.getAllKeys('TestController');

      expect(storage.has(hiddenLegacyKey)).toBe(true);
      expect(result).toStrictEqual({});
      expect(keys).toStrictEqual([]);
      expect(mockGet).not.toHaveBeenCalledWith(null);
    });

    it('does not throw when removing indexed keys fails', async () => {
      const storageKey = `${valueKeyPrefix}generated`;
      mockGet.mockImplementation(async (key) => {
        if (key === indexKey0) {
          return {
            [indexKey0]: {
              version: 1,
              updatedAt: 1,
              keys: { myKey: storageKey },
            },
          };
        }
        return {};
      });
      const error = new Error('Storage error');
      mockRemove.mockRejectedValue(error);

      await adapter.clear('TestController');

      expect(mockRemove).toHaveBeenCalledWith(storageKey);
    });
  });
});
