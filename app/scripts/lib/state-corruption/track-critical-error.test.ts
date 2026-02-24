import { segment } from '../segment';
import { CriticalErrorType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../stores/persistence-manager';
import { trackCriticalErrorEvent } from './track-critical-error';

jest.mock('../segment', () => ({
  segment: {
    track: jest.fn(),
    flush: jest.fn(),
  },
}));

const mockSegment = segment as jest.Mocked<typeof segment>;

describe('trackCriticalErrorEvent', () => {
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

    trackCriticalErrorEvent(
      backup,
      MetaMetricsEventName.CriticalErrorScreenViewed,
      CriticalErrorType.BackgroundInitTimeout,
    );

    expect(mockSegment.track).toHaveBeenCalledWith({
      userId: 'test-metrics-id-123',
      event: MetaMetricsEventName.CriticalErrorScreenViewed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_type: CriticalErrorType.BackgroundInitTimeout,
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

  it('includes optional properties in the tracked event', () => {
    const backup: Backup = {
      KeyringController: { vault: 'encrypted-vault-data' },
      AppMetadataController: {},
      MetaMetricsController: {
        participateInMetaMetrics: true,
        metaMetricsId: 'test-metrics-id-456',
      },
    };

    trackCriticalErrorEvent(
      backup,
      MetaMetricsEventName.CriticalErrorRestoreWalletButtonPressed,
      CriticalErrorType.BackgroundStateSyncTimeout,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { restore_accounts_enabled: true },
    );

    expect(mockSegment.track).toHaveBeenCalledWith({
      userId: 'test-metrics-id-456',
      event: MetaMetricsEventName.CriticalErrorRestoreWalletButtonPressed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_type: CriticalErrorType.BackgroundStateSyncTimeout,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        restore_accounts_enabled: true,
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
    trackCriticalErrorEvent(
      backup,
      MetaMetricsEventName.CriticalErrorScreenViewed,
      CriticalErrorType.Other,
    );

    expect(mockSegment.track).not.toHaveBeenCalled();
    expect(mockSegment.flush).not.toHaveBeenCalled();
  });
});
