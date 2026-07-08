import type { Hex } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  configureOptOutSegmentEnrichment,
  trackEarlySegmentEvent,
  trackSegmentEventWhileOptedOut,
  type EarlySegmentState,
} from './custom-segment-tracking';
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
        AnalyticsController: {
          optedIn: true,
          analyticsId: 'test-metrics-id-123',
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
        AnalyticsController: {
          optedIn: true,
          analyticsId: 'test-metrics-id-456',
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
    ['analyticsId is missing', { AnalyticsController: { optedIn: true } }],
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

describe('trackSegmentEventWhileOptedOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureOptOutSegmentEnrichment({
      getLocale: () => 'en-US',
      getDefaultChainId: () => '0x1' as Hex,
      getPageChainProperties: () => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: '0x1',
      }),
      getProfileIdentityProperties: () => ({}),
      getMarketingCampaignCookieId: () => null,
      hasMarketingConsent: () => false,
      hasBasicFunctionalityEnabled: () => true,
      getRemoteFeatureFlags: () => ({}),
      appVersion: '1.0.0',
      userAgent: '',
    });
  });

  it('tracks event directly to Segment and flushes immediately', () => {
    trackSegmentEventWhileOptedOut({
      analyticsId: 'test-metrics-id-789',
      event: MetaMetricsEventName.MetricsOptOut,
      properties: {
        category: MetaMetricsEventCategory.Onboarding,
      },
      context: {
        page: {
          path: '/onboarding',
        },
      },
    });

    expect(mockSegment.track).toHaveBeenCalledWith({
      userId: 'test-metrics-id-789',
      event: MetaMetricsEventName.MetricsOptOut,
      properties: {
        category: MetaMetricsEventCategory.Onboarding,
        locale: 'en-US',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: '0x1',
      },
      context: {
        page: {
          path: '/onboarding',
        },
        app: {
          name: 'MetaMask Extension',
          version: '1.0.0',
        },
        userAgent: '',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        marketingCampaignCookieId: null,
      },
    });
    expect(mockSegment.flush).toHaveBeenCalledTimes(1);
  });

  it('does not track when analyticsId is empty', () => {
    trackSegmentEventWhileOptedOut({
      analyticsId: '',
      event: MetaMetricsEventName.MetricsOptOut,
    });

    expect(mockSegment.track).not.toHaveBeenCalled();
    expect(mockSegment.flush).not.toHaveBeenCalled();
  });

  it('does not track when basic functionality is disabled', () => {
    configureOptOutSegmentEnrichment({
      getLocale: () => 'en-US',
      getDefaultChainId: () => '0x1' as Hex,
      getPageChainProperties: () => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: '0x1',
      }),
      getProfileIdentityProperties: () => ({}),
      getMarketingCampaignCookieId: () => null,
      hasMarketingConsent: () => false,
      hasBasicFunctionalityEnabled: () => false,
      getRemoteFeatureFlags: () => ({}),
      appVersion: '1.0.0',
      userAgent: '',
    });

    trackSegmentEventWhileOptedOut({
      analyticsId: 'test-metrics-id-789',
      event: MetaMetricsEventName.MetricsOptOut,
    });

    expect(mockSegment.track).not.toHaveBeenCalled();
    expect(mockSegment.flush).not.toHaveBeenCalled();
  });
});
