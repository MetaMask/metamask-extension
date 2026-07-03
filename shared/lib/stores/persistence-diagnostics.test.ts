import 'fake-indexeddb/auto';

import {
  SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME,
  SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_FEATURE_FLAG,
  SplitStatePersistenceDiagnostics,
  getSplitStatePersistenceDiagnosticsConfig,
  getSplitStateDiagnosticError,
  type SplitStatePersistenceDiagnosticsConfig,
  type SplitStateReadDiagnostics,
} from './persistence-diagnostics';

async function deleteDiagnosticsDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(
      SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_DB_NAME,
    );
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked'));
  });
}

function getEnabledConfig(
  overrides: Record<string, unknown> = {},
) {
  const config = getSplitStatePersistenceDiagnosticsConfig({
    [SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_FEATURE_FLAG]: {
      enabled: true,
      ...overrides,
    },
  });

  if (!config) {
    throw new Error('Expected diagnostics config to be enabled');
  }

  return config;
}

describe('SplitStatePersistenceDiagnostics', () => {
  let diagnostics: SplitStatePersistenceDiagnostics;
  let config: SplitStatePersistenceDiagnosticsConfig;

  beforeEach(async () => {
    await deleteDiagnosticsDatabase();
    config = getEnabledConfig();
    diagnostics = new SplitStatePersistenceDiagnostics();
    diagnostics.setConfig(config);
  });

  afterEach(() => {
    diagnostics.close();
  });

  it('records controller write counts without retaining values', () => {
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
      config,
      updatedAt: 1000,
      totalQueuedUpdates: 2,
      totalPersistedBatches: 1,
      topWrittenKeys: [
        {
          key: 'AccountTreeController',
          queuedUpdates: 1,
          persistedWrites: 1,
        },
        {
          key: 'KeyringController',
          queuedUpdates: 1,
          persistedWrites: 1,
        },
      ],
    });
    expect(JSON.stringify(snapshot)).not.toContain('secret-vault');
    expect(JSON.stringify(snapshot)).not.toContain('0x123');
  });

  it('does not collect diagnostics without the remote feature flag config', () => {
    diagnostics.setConfig(undefined);

    diagnostics.recordQueuedUpdate('KeyringController');
    diagnostics.recordPersistedBatch(
      new Map<string, unknown>([['KeyringController', { vault: 'secret' }]]),
    );

    expect(diagnostics.getSnapshot(undefined, 1000)).toBeUndefined();
  });

  it('normalizes remote feature flag config', () => {
    expect(
      getSplitStatePersistenceDiagnosticsConfig({
        [SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_FEATURE_FLAG]: {
          enabled: true,
          baselineEnabled: false,
          corruptionEnabled: true,
        },
      }),
    ).toStrictEqual({
      baselineEnabled: false,
      corruptionEnabled: true,
    });

    expect(getSplitStatePersistenceDiagnosticsConfig({})).toBeUndefined();
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

    const snapshot = await diagnostics.getSnapshotForReport(readDiagnostics);

    expect(snapshot).toMatchObject({
      totalQueuedUpdates: 0,
      totalPersistedBatches: 0,
      topWrittenKeys: [],
      readDiagnostics,
    });
  });

  it('returns diagnostic-safe errors', () => {
    const error = getSplitStateDiagnosticError(new Error('a'.repeat(300)));

    expect(error.errorName).toBe('Error');
    expect(error.errorMessage).toHaveLength(200);
  });
});
