import { segment } from '../segment';
import { VaultCorruptionType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import {
  SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_FEATURE_FLAG,
  getSplitStatePersistenceDiagnosticsConfig,
  type SplitStatePersistenceDiagnosticsSnapshot,
} from '../../../../shared/lib/stores/persistence-diagnostics';
import { trackVaultCorruptionEvent } from './track-vault-corruption';

jest.mock('../segment', () => ({
  segment: {
    track: jest.fn(),
    flush: jest.fn(),
  },
}));

const mockSegment = segment as jest.Mocked<typeof segment>;

function getDiagnosticsConfig() {
  const config = getSplitStatePersistenceDiagnosticsConfig({
    [SPLIT_STATE_PERSISTENCE_DIAGNOSTICS_FEATURE_FLAG]: {
      enabled: true,
    },
  });

  if (!config) {
    throw new Error('Expected diagnostics config to be enabled');
  }

  return config;
}

describe('trackVaultCorruptionEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks event with correct payload and flushes immediately when user has opted in', () => {
    const backup: Backup = {
      KeyringController: { vault: 'encrypted-vault-data' },
      AppMetadataController: {},
      AnalyticsController: {
        optedIn: true,
        analyticsId: 'test-metrics-id-123',
      },
      MetaMetricsController: {
        completedMetaMetricsOnboarding: true,
      },
    };

    trackVaultCorruptionEvent(
      backup,
      MetaMetricsEventName.VaultCorruptionDetected,
      VaultCorruptionType.InaccessibleDatabase,
    );

    expect(mockSegment.track).toHaveBeenCalledWith({
      userId: 'test-metrics-id-123',
      event: MetaMetricsEventName.VaultCorruptionDetected,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_type: VaultCorruptionType.InaccessibleDatabase,
        category: MetaMetricsEventCategory.Error,
      },
      context: {
        app: {
          name: 'MetaMask Extension',
          version: process.env.METAMASK_VERSION,
        },
      },
    });
    expect(mockSegment.flush).toHaveBeenCalledTimes(1);
  });

  it('includes split-state persistence diagnostics when provided', () => {
    const backup: Backup = {
      KeyringController: { vault: 'encrypted-vault-data' },
      AnalyticsController: {
        optedIn: true,
        analyticsId: 'test-metrics-id-123',
      },
    };
    const diagnostics: SplitStatePersistenceDiagnosticsSnapshot = {
      schemaVersion: 1,
      config: getDiagnosticsConfig(),
      updatedAt: 1000,
      totalQueuedUpdates: 1,
      totalPersistedBatches: 1,
      topWrittenKeys: [
        {
          key: 'PreferencesController',
          queuedUpdates: 1,
          persistedWrites: 1,
          lastSizeBucket: 'lt_4kb',
          maxSizeBucket: 'lt_4kb',
        },
      ],
      recentWideBatches: [],
      readDiagnostics: {
        manifestStatus: 'readable',
        manifestKeyCount: 1,
        readableKeys: [],
        missingKeys: [],
        failedKeys: [
          {
            key: 'PreferencesController',
            errorName: 'Error',
            errorMessage: 'block checksum mismatch',
          },
        ],
      },
    };

    trackVaultCorruptionEvent(
      backup,
      MetaMetricsEventName.VaultCorruptionDetected,
      VaultCorruptionType.InaccessibleDatabase,
      diagnostics,
    );

    expect(mockSegment.track).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_type: VaultCorruptionType.InaccessibleDatabase,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          split_state_persistence_diagnostics: diagnostics,
          category: MetaMetricsEventCategory.Error,
        },
      }),
    );
    expect(mockSegment.flush).toHaveBeenCalledTimes(1);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['backup is null', null],
    ['AnalyticsController is missing', { KeyringController: {} }],
    [
      'optedIn is false',
      {
        AnalyticsController: {
          optedIn: false,
          analyticsId: 'id',
        },
      },
    ],
    [
      'analyticsId is missing',
      {
        AnalyticsController: { optedIn: true },
      },
    ],
  ])('does not track when %s', (_: string, backup: Backup | null) => {
    trackVaultCorruptionEvent(
      backup,
      MetaMetricsEventName.VaultCorruptionDetected,
      VaultCorruptionType.MissingVaultInDatabase,
    );

    expect(mockSegment.track).not.toHaveBeenCalled();
    expect(mockSegment.flush).not.toHaveBeenCalled();
  });
});
