import 'fake-indexeddb/auto';
import browser from 'webextension-polyfill';
import type { Json } from '@metamask/utils';
import type { StorageGetResult } from '@metamask/storage-service';
import { IndexedDBEventDateStore } from './CronjobControllerStorageManager';
import {
  CronjobControllerStorageManager,
  CronjobControllerStorageKey,
  CronjobControllerEventDateNamespace,
} from './CronjobControllerStorageManager';

jest.mock('webextension-polyfill', () => {
  return {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
      },
    },
  };
});
const mockedBrowser = jest.mocked(browser);

/**
 * Create an in-memory stand-in for the date store, with the same surface the
 * manager uses from `StorageService` / `StorageAdapter`.
 *
 * @param initial - The dates the store starts out holding, keyed by event id.
 * @returns The fake store, plus the `data` object it is backed by.
 */
function createDateStore(initial: Record<string, Json> = {}) {
  const data: Record<string, Json> = { ...initial };

  return {
    data,
    getItem: jest.fn(
      async (_namespace: string, key: string): Promise<StorageGetResult> =>
        key in data ? { result: data[key] } : {},
    ),
    setItem: jest.fn(async (_namespace: string, key: string, value: Json) => {
      data[key] = value;
    }),
    removeItem: jest.fn(async (_namespace: string, key: string) => {
      delete data[key];
    }),
    getAllKeys: jest.fn(async () => Object.keys(data)),
  };
}

/**
 * Make `browser.storage.local.get` return the given main blob.
 *
 * @param state - The main blob to return, or `undefined` for no stored state.
 */
function mockStoredState(state: Json | undefined) {
  mockedBrowser.storage.local.get.mockImplementation(async () =>
    state === undefined ? {} : { [CronjobControllerStorageKey]: state },
  );
}

const EVENT_A = {
  id: 'a',
  snapId: 'npm:@metamask/example-snap',
  scheduledAt: '2026-01-01T00:00:00.000Z',
  date: '2026-01-01T00:00:30.000Z',
  schedule: 'PT30S',
  recurring: true,
  request: { method: 'onCronjob' },
};

describe('CronjobControllerStorageManager', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBrowser.storage.local.get.mockImplementation(async () => {
      return {
        [CronjobControllerStorageKey]: {
          mockKey: 'mockData',
        },
      };
    });
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

    it('returns null when no controller state is stored', async () => {
      mockedBrowser.storage.local.get.mockResolvedValueOnce({});
      const manager = new CronjobControllerStorageManager();
      await manager.init();

      const data = manager.getInitialState();

      expect(data).toBeNull();
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

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [CronjobControllerStorageKey]: { updatedMockkey: 'updatedData' },
      });
    });
  });

  describe('init reconciliation', () => {
    it('prefers the date store value when both stores hold the event', async () => {
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore({ a: '2026-01-01T00:05:00.000Z' });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: {
          a: { ...EVENT_A, date: '2026-01-01T00:05:00.000Z' },
        },
      });
      expect(dateStore.getItem).toHaveBeenCalledWith(
        CronjobControllerEventDateNamespace,
        'a',
      );
    });

    it('leaves state alone when the two stores already agree', async () => {
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore({ a: EVENT_A.date });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: { a: EVENT_A },
      });
      expect(dateStore.removeItem).not.toHaveBeenCalled();
    });

    it('falls back to the main blob date when the date store is missing the event', async () => {
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore();
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: { a: EVENT_A },
      });
      expect(dateStore.getItem).not.toHaveBeenCalled();
    });

    it('drops an event with no usable date in either store', async () => {
      const { date: _date, ...eventWithoutDate } = EVENT_A;
      mockStoredState({
        events: {
          a: eventWithoutDate,
          b: { ...EVENT_A, id: 'b', date: 'not-a-date' },
        },
      });
      const dateStore = createDateStore();
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({ events: {} });
    });

    it('falls back to the main blob date when the stored date is unparseable', async () => {
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore({ a: 'not-a-date' });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: { a: EVENT_A },
      });
    });

    it('removes date store keys with no matching event', async () => {
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore({
        a: EVENT_A.date,
        orphan: '2026-01-01T00:00:00.000Z',
      });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(dateStore.removeItem).toHaveBeenCalledTimes(1);
      expect(dateStore.removeItem).toHaveBeenCalledWith(
        CronjobControllerEventDateNamespace,
        'orphan',
      );
      expect(dateStore.data).toStrictEqual({ a: EVENT_A.date });
      expect(manager.getInitialState()).toStrictEqual({
        events: { a: EVENT_A },
      });
    });

    it('keeps every event when the date store is empty', async () => {
      mockStoredState({ events: { a: EVENT_A, b: { ...EVENT_A, id: 'b' } } });
      const dateStore = createDateStore();
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: { a: EVENT_A, b: { ...EVENT_A, id: 'b' } },
      });
      expect(dateStore.removeItem).not.toHaveBeenCalled();
    });

    it('removes every date store key when there is no stored state', async () => {
      mockStoredState(undefined);
      const dateStore = createDateStore({
        a: EVENT_A.date,
        b: EVENT_A.date,
      });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(dateStore.removeItem).toHaveBeenCalledTimes(2);
      expect(dateStore.data).toStrictEqual({});
      expect(manager.getInitialState()).toBeNull();
    });

    it('removes every date store key when the event map is empty', async () => {
      mockStoredState({ events: {} });
      const dateStore = createDateStore({ a: EVENT_A.date });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(dateStore.data).toStrictEqual({});
      expect(manager.getInitialState()).toStrictEqual({ events: {} });
    });

    it('preserves other top-level keys in the main blob', async () => {
      mockStoredState({ events: { a: EVENT_A }, somethingElse: 'kept' });
      const dateStore = createDateStore({ a: '2026-01-01T00:05:00.000Z' });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: { a: { ...EVENT_A, date: '2026-01-01T00:05:00.000Z' } },
        somethingElse: 'kept',
      });
    });

    it('touches nothing when the main blob is not shaped like an event map', async () => {
      mockStoredState({ mockKey: 'mockData' });
      const dateStore = createDateStore({ a: EVENT_A.date });
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({ mockKey: 'mockData' });
      expect(dateStore.getAllKeys).not.toHaveBeenCalled();
      expect(dateStore.removeItem).not.toHaveBeenCalled();
    });

    it('keeps the unreconciled state when the date store throws', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore();
      dateStore.getAllKeys.mockRejectedValue(new Error('storage unavailable'));
      const manager = new CronjobControllerStorageManager(dateStore);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: { a: EVENT_A },
      });
    });
  });

  describe('setEventDate', () => {
    it('throws if called before initialization', () => {
      const manager = new CronjobControllerStorageManager(createDateStore());

      expect(() => manager.setEventDate('a', EVENT_A.date)).toThrow(
        'CronjobControllerStorageManager not yet initialized',
      );
    });

    it('writes a single date to the date store', async () => {
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore({ a: EVENT_A.date });
      const manager = new CronjobControllerStorageManager(dateStore);
      await manager.init();

      manager.setEventDate('a', '2026-01-01T00:10:00.000Z');

      expect(dateStore.setItem).toHaveBeenCalledWith(
        CronjobControllerEventDateNamespace,
        'a',
        '2026-01-01T00:10:00.000Z',
      );
      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('deleteEventDate', () => {
    it('throws if called before initialization', () => {
      const manager = new CronjobControllerStorageManager(createDateStore());

      expect(() => manager.deleteEventDate('a')).toThrow(
        'CronjobControllerStorageManager not yet initialized',
      );
    });

    it('removes a single date from the date store', async () => {
      mockStoredState({ events: { a: EVENT_A } });
      const dateStore = createDateStore({ a: EVENT_A.date });
      const manager = new CronjobControllerStorageManager(dateStore);
      await manager.init();

      manager.deleteEventDate('a');

      expect(dateStore.removeItem).toHaveBeenCalledWith(
        CronjobControllerEventDateNamespace,
        'a',
      );
    });
  });
});

describe('IndexedDBEventDateStore', () => {
  // The database outlives any one instance of the class — that is the point of
  // it — so tests are isolated by namespace rather than by deleting it, which
  // would block on the connection the previous test left open.
  it('round-trips a value', async () => {
    const store = new IndexedDBEventDateStore();

    await store.setItem('roundtrip', 'foo', '2026-01-01T00:00:00.000Z');

    expect(await store.getItem('roundtrip', 'foo')).toStrictEqual({
      result: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns an empty result for a missing key', async () => {
    const store = new IndexedDBEventDateStore();

    expect(await store.getItem('missing', 'absent')).toStrictEqual({});
  });

  it('removes a value', async () => {
    const store = new IndexedDBEventDateStore();
    await store.setItem('removal', 'gone', 'x');

    await store.removeItem('removal', 'gone');

    expect(await store.getItem('removal', 'gone')).toStrictEqual({});
  });

  it('lists only the keys in the requested namespace, unprefixed', async () => {
    const store = new IndexedDBEventDateStore();
    await store.setItem('listing', 'a', '1');
    await store.setItem('listing', 'b', '2');
    await store.setItem('listing-other', 'c', '3');

    expect((await store.getAllKeys('listing')).sort()).toStrictEqual(['a', 'b']);
  });

  it('shares one database across instances', async () => {
    await new IndexedDBEventDateStore().setItem('shared', 'k', 'v');

    // A second instance must see the first one's write, or a service-worker
    // restart would lose every date.
    expect(await new IndexedDBEventDateStore().getItem('shared', 'k')).toStrictEqual(
      { result: 'v' },
    );
  });
});
