import 'fake-indexeddb/auto';
import { cloneDeep } from 'lodash';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import {
  BACKUP_INDEXED_DB_NAME,
  BACKUP_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-constants';
import { migrate, version } from './230';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  const database = new IndexedDBStore();

  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(BACKUP_INDEXED_DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        throw new Error("this shouldn't happen. You have an error somewhere");
      };
    });
    await database.open(BACKUP_INDEXED_DB_NAME, BACKUP_INDEXED_DB_VERSION);
  });

  afterEach(() => {
    database.close();
  });

  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('deletes the empty MetaMetricsController key and leaves sibling controllers untouched', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {},
        AnalyticsController: {
          optedIn: true,
          analyticsId: 'test-analytics-id',
        },
        PreferencesController: {
          infuraBlocked: false,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).not.toHaveProperty('MetaMetricsController');
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      optedIn: true,
      analyticsId: 'test-analytics-id',
    });
    expect(versionedData.data.PreferencesController).toStrictEqual({
      infuraBlocked: false,
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
  });

  it('deletes the whole MetaMetricsController key even when it contains fields', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          someLegacyField: 'legacy-value',
          anotherLegacyField: 42,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).not.toHaveProperty('MetaMetricsController');
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
  });

  it('returns state unchanged when MetaMetricsController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AnalyticsController: {
          optedIn: false,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('MetaMetricsController')).toBe(false);
  });

  it('removes the orphaned MetaMetricsController record from the backup database', async () => {
    await database.set({
      MetaMetricsController: { participateInMetaMetrics: true },
      KeyringController: { vault: 'data' },
    });

    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {},
        AnalyticsController: { optedIn: true },
      },
    };
    await migrate(oldStorage, new Set<string>());

    const values = await database.get([
      'MetaMetricsController',
      'KeyringController',
    ]);
    expect(values[0]).toBeUndefined();
    // `toEqual` (not `toStrictEqual`): the value round-trips through the
    // structured clone of the (fake) IndexedDB, changing its prototype.
    expect(values[1]).toEqual({ vault: 'data' });
  });

  it('removes the backup record even when the app-state key is missing', async () => {
    await database.set({
      MetaMetricsController: { participateInMetaMetrics: true },
    });

    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AnalyticsController: { optedIn: false },
      },
    };
    await migrate(oldStorage, new Set<string>());

    const [value] = await database.get(['MetaMetricsController']);
    expect(value).toBeUndefined();
  });

  it('does not throw when the backup database is unavailable', async () => {
    // The migration logs a warning when the backup database can't be opened;
    // silence it so this suite produces no console output.
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
    jest
      .spyOn(IndexedDBStore.prototype, 'open')
      .mockRejectedValue(new Error('Database is not available'));

    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {},
      },
    };

    await expect(
      migrate(oldStorage, new Set<string>()),
    ).resolves.toBeUndefined();
    expect(oldStorage.meta.version).toBe(VERSION);

    jest.restoreAllMocks();
  });
});
