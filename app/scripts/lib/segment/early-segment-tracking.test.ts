import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  trackEarlySegmentEvent,
  type EarlySegmentState,
} from './early-segment-tracking';
import { segment } from '.';

jest.mock('.', () => ({
  segment: {
    track: jest.fn(),
    flush: jest.fn(),
  },
}));

const mockSegment = segment as jest.Mocked<typeof segment>;

describe('trackEarlySegmentEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks event with correct payload and flushes immediately when user has opted in', () => {
    trackEarlySegmentEvent({
      state: {
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsId: 'test-metrics-id-123',
        },
      },
      event: MetaMetricsEventName.StateMigrationSucceeded,
      category: MetaMetricsEventCategory.StateMigration,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        migration_name: 'split_state',
      },
    });

    expect(mockSegment.track).toHaveBeenCalledWith({
      userId: 'test-metrics-id-123',
      event: MetaMetricsEventName.StateMigrationSucceeded,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        migration_name: 'split_state',
        category: MetaMetricsEventCategory.StateMigration,
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

  it('merges custom context with the default app context', () => {
    trackEarlySegmentEvent({
      state: {
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsId: 'test-metrics-id-456',
        },
      },
      event: MetaMetricsEventName.StateMigrationSucceeded,
      category: MetaMetricsEventCategory.StateMigration,
      context: {
        page: {
          path: '/test',
        },
      },
    });

    expect(mockSegment.track).toHaveBeenCalledWith({
      userId: 'test-metrics-id-456',
      event: MetaMetricsEventName.StateMigrationSucceeded,
      properties: {
        category: MetaMetricsEventCategory.StateMigration,
      },
      context: {
        app: {
          name: 'MetaMask Extension',
          version: process.env.METAMASK_VERSION,
        },
        page: {
          path: '/test',
        },
      },
    });
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['state is null', null],
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
  ])('does not track when %s', (_: string, state: EarlySegmentState | null) => {
    trackEarlySegmentEvent({
      state,
      event: MetaMetricsEventName.StateMigrationFailed,
      category: MetaMetricsEventCategory.StateMigration,
    });

    expect(mockSegment.track).not.toHaveBeenCalled();
    expect(mockSegment.flush).not.toHaveBeenCalled();
  });
});
