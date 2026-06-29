import 'fake-indexeddb/auto';

import {
  SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME,
  SplitStatePersistenceDiagnostics,
  getSplitStateDiagnosticError,
  getSplitStateSizeBucket,
  type SplitStateReadDiagnostics,
} from './persistence-diagnostics';

async function deleteDiagnosticsDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(
      SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME,
    );
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked'));
  });
}

describe('SplitStatePersistenceDiagnostics', () => {
  let diagnostics: SplitStatePersistenceDiagnostics;

  beforeEach(async () => {
    await deleteDiagnosticsDatabase();
    diagnostics = new SplitStatePersistenceDiagnostics();
  });

  afterEach(() => {
    diagnostics.close();
  });

  it('records controller write counts and size buckets without retaining values', () => {
    diagnostics.recordQueuedUpdate('KeyringController');
    diagnostics.recordQueuedUpdate('AccountTreeController');
    diagnostics.recordQueuedUpdate('meta');

    diagnostics.recordPersistedBatch(
      new Map<string, unknown>([
        ['KeyringController', { vault: 'secret-vault' }],
        ['AccountTreeController', { accounts: ['0x123'] }],
        ['meta', { version: 1 }],
      ]),
    );

    const snapshot = diagnostics.getSnapshot(undefined, 1000);

    expect(snapshot).toStrictEqual({
      schemaVersion: 1,
      updatedAt: 1000,
      totalQueuedUpdates: 2,
      totalPersistedBatches: 1,
      topWrittenKeys: [
        {
          key: 'AccountTreeController',
          queuedUpdates: 1,
          persistedWrites: 1,
          lastSizeBucket: 'lt_4kb',
          maxSizeBucket: 'lt_4kb',
        },
        {
          key: 'KeyringController',
          queuedUpdates: 1,
          persistedWrites: 1,
          lastSizeBucket: 'lt_4kb',
          maxSizeBucket: 'lt_4kb',
        },
      ],
      recentWideBatches: [],
    });
    expect(JSON.stringify(snapshot)).not.toContain('secret-vault');
    expect(JSON.stringify(snapshot)).not.toContain('0x123');
  });

  it('records recent wide batches with largest key size buckets', () => {
    diagnostics.recordPersistedBatch(
      new Map<string, unknown>([
        ['SmallController', { value: true }],
        ['LargeController', { value: 'x'.repeat(5000) }],
        ['DeletedController', undefined],
        ['OtherController', { nested: { value: 'test' } }],
      ]),
    );

    expect(
      diagnostics.getSnapshot(undefined, 1000).recentWideBatches,
    ).toStrictEqual([
      {
        keys: [
          'SmallController',
          'LargeController',
          'DeletedController',
          'OtherController',
        ],
        keyCount: 4,
        totalSizeBucket: '4kb_16kb',
        largestKeys: [
          {
            key: 'LargeController',
            sizeBucket: '4kb_16kb',
          },
          {
            key: 'OtherController',
            sizeBucket: 'lt_4kb',
          },
          {
            key: 'SmallController',
            sizeBucket: 'lt_4kb',
          },
          {
            key: 'DeletedController',
            sizeBucket: 'undefined',
          },
        ],
      },
    ]);
  });

  it('persists and hydrates diagnostics snapshots from IndexedDB', async () => {
    diagnostics.recordQueuedUpdate('KeyringController');
    diagnostics.recordPersistedBatch(
      new Map<string, unknown>([['KeyringController', { vault: 'secret' }]]),
    );
    await diagnostics.persistSnapshot(1000);
    diagnostics.close();

    const nextDiagnostics = new SplitStatePersistenceDiagnostics();
    const snapshot = await nextDiagnostics.getSnapshotForReport();
    nextDiagnostics.close();

    expect(snapshot).toMatchObject({
      totalQueuedUpdates: 1,
      totalPersistedBatches: 1,
      topWrittenKeys: [
        {
          key: 'KeyringController',
          queuedUpdates: 1,
          persistedWrites: 1,
        },
      ],
    });
  });

  it('returns a baseline snapshot at most once per week', async () => {
    diagnostics.recordQueuedUpdate('KeyringController');
    diagnostics.recordPersistedBatch(
      new Map<string, unknown>([['KeyringController', { vault: 'secret' }]]),
    );

    const firstSnapshot = await diagnostics.getWeeklyBaselineSnapshot(1000);
    const secondSnapshot = await diagnostics.getWeeklyBaselineSnapshot(
      1000 + 6 * 24 * 60 * 60 * 1000,
    );
    const thirdSnapshot = await diagnostics.getWeeklyBaselineSnapshot(
      1000 + 7 * 24 * 60 * 60 * 1000,
    );

    expect(firstSnapshot).toMatchObject({
      totalQueuedUpdates: 1,
      totalPersistedBatches: 1,
    });
    expect(secondSnapshot).toBeUndefined();
    expect(thirdSnapshot).toMatchObject({
      totalQueuedUpdates: 1,
      totalPersistedBatches: 1,
    });
  });

  it('persists the weekly baseline gate across diagnostics instances', async () => {
    diagnostics.recordQueuedUpdate('KeyringController');
    diagnostics.recordPersistedBatch(
      new Map<string, unknown>([['KeyringController', { vault: 'secret' }]]),
    );
    await diagnostics.getWeeklyBaselineSnapshot(1000);
    diagnostics.close();

    const nextDiagnostics = new SplitStatePersistenceDiagnostics();
    const snapshot = await nextDiagnostics.getWeeklyBaselineSnapshot(
      1000 + 6 * 24 * 60 * 60 * 1000,
    );
    nextDiagnostics.close();

    expect(snapshot).toBeUndefined();
  });

  it('can report read diagnostics even when there are no write stats', async () => {
    const readDiagnostics: SplitStateReadDiagnostics = {
      manifestStatus: 'readable',
      manifestKeyCount: 2,
      readableKeys: ['KeyringController'],
      missingKeys: [],
      failedKeys: [
        {
          key: 'PreferencesController',
          errorName: 'Error',
          errorMessage: 'block checksum mismatch',
        },
      ],
    };

    const snapshot =
      await diagnostics.getSnapshotForReport(readDiagnostics);

    expect(snapshot).toMatchObject({
      totalQueuedUpdates: 0,
      totalPersistedBatches: 0,
      topWrittenKeys: [],
      recentWideBatches: [],
      readDiagnostics,
    });
  });

  it('returns coarse size buckets and diagnostic-safe errors', () => {
    expect(getSplitStateSizeBucket({ value: 'x'.repeat(4096) })).toBe(
      '4kb_16kb',
    );

    const error = getSplitStateDiagnosticError(
      new Error('a'.repeat(300)),
    );

    expect(error.errorName).toBe('Error');
    expect(error.errorMessage).toHaveLength(200);
  });
});
