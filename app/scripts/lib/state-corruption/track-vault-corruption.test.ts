import { segment } from '../segment';
import { VaultCorruptionType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../stores/persistence-manager';
import { trackVaultCorruptionEvent } from './track-vault-corruption';

jest.mock('../segment', () => ({
  segment: {
    track: jest.fn(),
    flush: jest.fn(),
  },
}));

const mockSegment = segment as jest.Mocked<typeof segment>;

describe('trackVaultCorruptionEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks event with correct payload and flushes immediately when user has opted in', () => {
    const backup: Backup = {
      KeyringController: { vault: 'encrypted-vault-data' },
      AppMetadataController: {},
      MetaMetricsController: {
        participateInMetaMetrics: true,
        metaMetricsId: 'test-metrics-id-123',
      },
    };

    trackVaultCorruptionEvent(
      backup,
      MetaMetricsEventName.VaultCorruptionDetected,
      VaultCorruptionType.UnaccessibleDatabase,
    );

    expect(mockSegment.track).toHaveBeenCalledWith({
      userId: 'test-metrics-id-123',
      event: MetaMetricsEventName.VaultCorruptionDetected,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_type: VaultCorruptionType.UnaccessibleDatabase,
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

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['backup is null', null],
    ['MetaMetricsController is missing', { KeyringController: {} }],
    [
      'participateInMetaMetrics is false',
      {
        MetaMetricsController: {
          participateInMetaMetrics: false,
          metaMetricsId: 'id',
        },
      },
    ],
    [
      'participateInMetaMetrics is null',
      {
        MetaMetricsController: {
          participateInMetaMetrics: null,
          metaMetricsId: 'id',
        },
      },
    ],
    [
      'metaMetricsId is missing',
      { MetaMetricsController: { participateInMetaMetrics: true } },
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
