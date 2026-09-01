import browser from 'webextension-polyfill';
import type { Json } from '@metamask/utils';
import type { StorageGetResult } from '@metamask/storage-service';
import {
  CronjobControllerStorageManager,
  CronjobControllerStorageKey,
  CronjobControllerEventDateNamespace,
  type CronjobControllerEventDateStore,
} from './CronjobControllerStorageManager';

/**
 * Build an in-memory date store.
 *
 * @param initial - Dates to seed it with, keyed by event ID.
 * @returns A store plus the map backing it, so tests can assert on writes.
 */
function getMockDateStore(initial: Record<string, string> = {}) {
  const dates = new Map<string, string>(Object.entries(initial));

  const store: CronjobControllerEventDateStore = {
    getItem: async (_namespace, key): Promise<StorageGetResult> => {
      const value = dates.get(key);
      return value === undefined ? {} : { result: value };
    },
    setItem: async (_namespace, key, value) => {
      dates.set(key, value as string);
    },
    removeItem: async (_namespace, key) => {
      dates.delete(key);
    },
    getAllKeys: async () => Array.from(dates.keys()),
  };

  return { store, dates };
}

/**
 * Seed `browser.storage.local` with an event map.
 *
 * @param events - The events to seed.
 */
function seedEvents(events: Record<string, Json>) {
  jest
    .mocked(browser)
    .storage.local.get.mockImplementation(async () => ({
      [CronjobControllerStorageKey]: { events },
    }));
}

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

  describe('reconciliation', () => {
    const event = {
      id: 'foo',
      snapId: 'npm:@metamask/example-snap',
      schedule: 'PT30S',
      scheduledAt: '2026-01-01T00:00:00.000Z',
      recurring: true,
      request: { method: 'exampleMethod' },
    };

    it('prefers the date store over the stale date in the event map', async () => {
      seedEvents({ foo: { ...event, date: '2026-01-01T00:00:30.000Z' } });
      const { store } = getMockDateStore({ foo: '2026-06-01T12:00:00.000Z' });
      const manager = new CronjobControllerStorageManager(store);

      await manager.init();

      // The event map's copy is only rewritten when events are added or
      // removed, so it is stale by design whenever both are present.
      expect(manager.getInitialState()).toStrictEqual({
        events: { foo: { ...event, date: '2026-06-01T12:00:00.000Z' } },
      });
    });

    it('falls back to the event map when the date store has no date', async () => {
      seedEvents({ foo: { ...event, date: '2026-01-01T00:00:30.000Z' } });
      const { store } = getMockDateStore();
      const manager = new CronjobControllerStorageManager(store);

      await manager.init();

      expect(manager.getInitialState()).toStrictEqual({
        events: { foo: { ...event, date: '2026-01-01T00:00:30.000Z' } },
      });
    });

    it('drops an event with no usable date in either store', async () => {
      seedEvents({ foo: { ...event, date: 'not-a-date' } });
      const { store } = getMockDateStore();
      const manager = new CronjobControllerStorageManager(store);

      await manager.init();

      // An event with no usable date can neither fire nor be cleared, so
      // keeping it would strand it forever.
      expect(manager.getInitialState()).toStrictEqual({ events: {} });
    });

    it('sweeps a date whose event is gone', async () => {
      seedEvents({ foo: { ...event, date: '2026-06-01T12:00:00.000Z' } });
      const { store, dates } = getMockDateStore({
        foo: '2026-06-01T12:00:00.000Z',
        orphan: '2026-06-01T12:00:00.000Z',
      });
      const manager = new CronjobControllerStorageManager(store);

      await manager.init();

      // Nothing removed dates before `deleteEventDate` existed, so any key
      // without a matching event is garbage.
      expect(Array.from(dates.keys())).toStrictEqual(['foo']);
    });

    it('leaves state alone when it holds no events', async () => {
      jest
        .mocked(browser)
        .storage.local.get.mockImplementation(async () => ({
          [CronjobControllerStorageKey]: null,
        }));
      const { store } = getMockDateStore();
      const manager = new CronjobControllerStorageManager(store);

      await manager.init();

      expect(manager.getInitialState()).toBeNull();
    });
  });

  describe('setEventDate', () => {
    it('writes the date to the date store, not to storage.local', async () => {
      const { store, dates } = getMockDateStore();
      const manager = new CronjobControllerStorageManager(store);
      await manager.init();
      jest.mocked(browser).storage.local.set.mockClear();

      manager.setEventDate('foo', '2026-06-01T12:00:00.000Z');
      await Promise.resolve();

      expect(dates.get('foo')).toBe('2026-06-01T12:00:00.000Z');
      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });

    it('throws before initialization', () => {
      const { store } = getMockDateStore();
      const manager = new CronjobControllerStorageManager(store);

      expect(() => manager.setEventDate('foo', 'x')).toThrow(
        'CronjobControllerStorageManager not yet initialized',
      );
    });
  });

  describe('deleteEventDate', () => {
    it('removes the date from the date store', async () => {
      const { store, dates } = getMockDateStore({ foo: '2026-06-01T12:00:00.000Z' });
      seedEvents({});
      const manager = new CronjobControllerStorageManager(store);
      await manager.init();

      manager.deleteEventDate('foo');
      await Promise.resolve();

      expect(dates.has('foo')).toBe(false);
    });
  });
});
