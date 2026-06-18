import browser from 'webextension-polyfill';
import { captureException } from '../../../shared/lib/sentry';
import {
  CronjobControllerStoragePointerKeyPrefix,
  CronjobControllerStorageManager,
  CronjobControllerStorageKey,
  CronjobControllerStorageValueKeyPrefix,
} from './CronjobControllerStorageManager';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

jest.mock('webextension-polyfill', () => {
  return {
    storage: {
      local: {
        get: jest.fn(),
        remove: jest.fn(),
        set: jest.fn(),
      },
    },
  };
});
const mockedBrowser = jest.mocked(browser);

const pointerKey0 = `${CronjobControllerStoragePointerKeyPrefix}0`;
const pointerKey1 = `${CronjobControllerStoragePointerKeyPrefix}1`;
const pointerKey2 = `${CronjobControllerStoragePointerKeyPrefix}2`;
const pointerKey3 = `${CronjobControllerStoragePointerKeyPrefix}3`;
const pointerKey4 = `${CronjobControllerStoragePointerKeyPrefix}4`;
const pointerKeys = [
  pointerKey0,
  pointerKey1,
  pointerKey2,
  pointerKey3,
  pointerKey4,
  `${CronjobControllerStoragePointerKeyPrefix}5`,
  `${CronjobControllerStoragePointerKeyPrefix}6`,
  `${CronjobControllerStoragePointerKeyPrefix}7`,
];

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function flushQueuedCronjobWrites() {
  await flushPromises();
  await flushPromises();
  await flushPromises();
}

describe('CronjobControllerStorageManager', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBrowser.storage.local.get.mockImplementation(async (key) => {
      if (key === CronjobControllerStorageKey) {
        return {
          [CronjobControllerStorageKey]: {
            mockKey: 'mockData',
          },
        };
      }
      return {};
    });
    mockedBrowser.storage.local.remove.mockImplementation(() =>
      Promise.resolve(),
    );
    mockedBrowser.storage.local.set.mockImplementation(() => Promise.resolve());
  });

  describe('init', () => {
    it('requests the correct state key', async () => {
      const manager = new CronjobControllerStorageManager();

      await manager.init();

      expect(browser.storage.local.get).toHaveBeenCalledWith(
        CronjobControllerStorageKey,
      );
    });

    it('reads generated storage when a pointer is present', async () => {
      mockedBrowser.storage.local.get.mockImplementation(async (key) => {
        if (key === pointerKey0) {
          return {
            [pointerKey0]: {
              version: 1,
              updatedAt: 1,
              storageKey: `${CronjobControllerStorageValueKeyPrefix}abc`,
            },
          };
        }
        if (key === pointerKey1) {
          return {};
        }
        if (key === `${CronjobControllerStorageValueKeyPrefix}abc`) {
          return {
            [`${CronjobControllerStorageValueKeyPrefix}abc`]: {
              generatedKey: 'generatedData',
            },
          };
        }
        return {};
      });
      const manager = new CronjobControllerStorageManager();

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        generatedKey: 'generatedData',
      });
      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CronjobControllerStorageKey,
      );
    });

    it('does not fall back to stale legacy storage when a pointer is present but generated storage is missing', async () => {
      const generatedStorageKey = `${CronjobControllerStorageValueKeyPrefix}abc`;
      mockedBrowser.storage.local.get.mockImplementation(async (key) => {
        if (key === pointerKey0) {
          return {
            [pointerKey0]: {
              version: 1,
              updatedAt: 1,
              storageKey: generatedStorageKey,
            },
          };
        }
        if (key === CronjobControllerStorageKey) {
          return {
            [CronjobControllerStorageKey]: {
              staleKey: 'staleData',
            },
          };
        }
        return {};
      });
      const manager = new CronjobControllerStorageManager();

      await manager.init();

      expect(manager.getInitialState()).toBeNull();
      expect(browser.storage.local.get).toHaveBeenCalledWith(
        generatedStorageKey,
      );
      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CronjobControllerStorageKey,
      );
    });

    it('reads generated storage when the original pointer slots are unreadable', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockedBrowser.storage.local.get.mockImplementation(async (key) => {
        if (pointerKeys.slice(0, 4).includes(key as string)) {
          throw new Error(`block checksum mismatch for ${key as string}`);
        }
        if (key === pointerKey4) {
          return {
            [pointerKey4]: {
              version: 1,
              updatedAt: 1,
              storageKey: `${CronjobControllerStorageValueKeyPrefix}abc`,
            },
          };
        }
        if (key === `${CronjobControllerStorageValueKeyPrefix}abc`) {
          return {
            [`${CronjobControllerStorageValueKeyPrefix}abc`]: {
              generatedKey: 'generatedData',
            },
          };
        }
        return {};
      });
      const manager = new CronjobControllerStorageManager();

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        generatedKey: 'generatedData',
      });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CronjobControllerStorageKey,
      );
      consoleErrorSpy.mockRestore();
    });

    it('does not fall back to stale legacy storage when pointer slots are unreadable', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockedBrowser.storage.local.get.mockImplementation(async (key) => {
        if (pointerKeys.includes(key as string)) {
          throw new Error(`block checksum mismatch for ${key as string}`);
        }
        if (key === CronjobControllerStorageKey) {
          return {
            [CronjobControllerStorageKey]: {
              mockKey: 'legacyData',
            },
          };
        }
        return {};
      });
      const manager = new CronjobControllerStorageManager();

      await manager.init();

      expect(manager.getInitialState()).toBeNull();
      expect(browser.storage.local.get).not.toHaveBeenCalledWith(
        CronjobControllerStorageKey,
      );
      consoleErrorSpy.mockRestore();
    });

    it('initializes with null state when legacy storage is unreadable', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockedBrowser.storage.local.get.mockImplementation(async (key) => {
        if (key === CronjobControllerStorageKey) {
          throw new Error('block checksum mismatch');
        }
        return {};
      });
      const manager = new CronjobControllerStorageManager();

      await manager.init();

      expect(manager.getInitialState()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'CronjobControllerStorageManager failed to read legacy storage',
        expect.any(Error),
      );
      expect(jest.mocked(captureException)).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'CronjobControllerStorageManager failed to read legacy storage',
          cause: expect.any(Error),
        }),
        {
          tags: {
            'persistence.storage_area': 'local',
            'persistence.storage_operation': 'read',
            'persistence.storage_key_class': 'cronjob-legacy-state',
          },
        },
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getInitialState', () => {
    it('throws if called before initialization', () => {
      const manager = new CronjobControllerStorageManager();

      expect(() => manager.getInitialState()).toThrow(
        'CronjobControllerStorageManager not yet initialized',
      );
    });

    it('returns initial controller state', async () => {
      const manager = new CronjobControllerStorageManager();
      await manager.init();

      const data = manager.getInitialState();

      expect(data).toStrictEqual({ mockKey: 'mockData' });
    });
  });

  describe('set', () => {
    it('throws if called before initialization', () => {
      const manager = new CronjobControllerStorageManager();

      expect(() => manager.set({ foo: 'bar' })).toThrow(
        'CronjobControllerStorageManager not yet initialized',
      );
    });

    it('sets state', async () => {
      const manager = new CronjobControllerStorageManager();
      await manager.init();

      manager.set({ updatedMockkey: 'updatedData' });
      await flushQueuedCronjobWrites();

      const generatedWrite = mockedBrowser.storage.local.set.mock.calls.find(
        ([value]) =>
          typeof value === 'object' &&
          value !== null &&
          Object.keys(value).some((key) =>
            key.startsWith(CronjobControllerStorageValueKeyPrefix),
          ),
      );
      expect(generatedWrite).toBeDefined();
      const generatedWriteValue = generatedWrite?.[0] as Record<
        string,
        unknown
      >;
      const generatedStorageKey = Object.keys(generatedWriteValue).find((key) =>
        key.startsWith(CronjobControllerStorageValueKeyPrefix),
      );
      expect(generatedStorageKey).toBeDefined();
      expect(generatedWriteValue[generatedStorageKey as string]).toStrictEqual({
        updatedMockkey: 'updatedData',
      });
      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [pointerKey0]: expect.objectContaining({
            storageKey: expect.stringMatching(
              `^${CronjobControllerStorageValueKeyPrefix}`,
            ),
          }),
          [pointerKey1]: expect.objectContaining({
            storageKey: expect.stringMatching(
              `^${CronjobControllerStorageValueKeyPrefix}`,
            ),
          }),
        }),
      );
      expect(browser.storage.local.remove).not.toHaveBeenCalledWith([
        CronjobControllerStorageKey,
      ]);
      expect(browser.storage.local.remove).not.toHaveBeenCalledWith(
        CronjobControllerStorageKey,
      );
    });

    it('removes the previous generated value after publishing a newer pointer', async () => {
      const previousGeneratedStorageKey = `${CronjobControllerStorageValueKeyPrefix}previous`;
      mockedBrowser.storage.local.get.mockImplementation(async (key) => {
        if (key === pointerKey0) {
          return {
            [pointerKey0]: {
              version: 1,
              updatedAt: 1,
              storageKey: previousGeneratedStorageKey,
            },
          };
        }
        if (key === previousGeneratedStorageKey) {
          return {
            [previousGeneratedStorageKey]: {
              generatedKey: 'generatedData',
            },
          };
        }
        return {};
      });
      const manager = new CronjobControllerStorageManager();
      await manager.init();

      manager.set({ updatedMockkey: 'updatedData' });
      await flushQueuedCronjobWrites();

      expect(browser.storage.local.remove).toHaveBeenCalledWith(
        previousGeneratedStorageKey,
      );
      expect(browser.storage.local.remove).not.toHaveBeenCalledWith(
        expect.arrayContaining([CronjobControllerStorageKey]),
      );
    });

    it('serializes generated writes so older pointers cannot publish after newer calls', async () => {
      const manager = new CronjobControllerStorageManager();
      await manager.init();
      let releaseFirstGeneratedWrite: () => void = () => undefined;
      let firstGeneratedWritePending = false;
      let generatedWriteCount = 0;
      mockedBrowser.storage.local.set.mockImplementation(async (value) => {
        const isGeneratedWrite =
          typeof value === 'object' &&
          value !== null &&
          Object.keys(value).some((key) =>
            key.startsWith(CronjobControllerStorageValueKeyPrefix),
          );
        if (!isGeneratedWrite) {
          return undefined;
        }

        generatedWriteCount += 1;
        if (generatedWriteCount === 1) {
          firstGeneratedWritePending = true;
          await new Promise<void>((resolve) => {
            releaseFirstGeneratedWrite = resolve;
          });
          firstGeneratedWritePending = false;
        }
        return undefined;
      });

      manager.set({ value: 'first' });
      manager.set({ value: 'second' });
      await flushPromises();

      expect(firstGeneratedWritePending).toBe(true);
      expect(generatedWriteCount).toBe(1);

      releaseFirstGeneratedWrite();
      await flushQueuedCronjobWrites();

      expect(generatedWriteCount).toBe(2);
      const pointerWrites = mockedBrowser.storage.local.set.mock.calls.filter(
        ([value]) =>
          typeof value === 'object' &&
          value !== null &&
          pointerKey0 in value &&
          pointerKey1 in value,
      );
      expect(pointerWrites).toHaveLength(2);
      const lastPointerWrite = pointerWrites.at(-1)?.[0] as Record<
        string,
        { storageKey: string }
      >;
      const secondGeneratedWrite =
        mockedBrowser.storage.local.set.mock.calls.find(
          ([value]) =>
            typeof value === 'object' &&
            value !== null &&
            Object.entries(value).some(
              ([key, storedValue]) =>
                key.startsWith(CronjobControllerStorageValueKeyPrefix) &&
                (storedValue as { value?: string }).value === 'second',
            ),
        )?.[0] as Record<string, unknown> | undefined;
      const secondGeneratedStorageKey = Object.keys(
        secondGeneratedWrite ?? {},
      ).find((key) => key.startsWith(CronjobControllerStorageValueKeyPrefix));

      expect(lastPointerWrite[pointerKey0].storageKey).toBe(
        secondGeneratedStorageKey,
      );
    });
  });
});
