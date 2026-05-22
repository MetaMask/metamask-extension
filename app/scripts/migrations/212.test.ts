import { cloneDeep } from 'lodash';
import { migrate, version } from './212';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('moves MetaMetrics participation and id to AnalyticsController and MMC prompt flag', async () => {
    const metaMetricsId = '0xabc123';
    const oldStorage: {
      meta: { version: number };
      data: Record<string, unknown>;
    } = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsId,
          latestNonAnonymousEventTimestamp: 0,
          eventsBeforeMetricsOptIn: [],
          tracesBeforeMetricsOptIn: [],
          traits: {},
          dataCollectionForMarketing: null,
          marketingCampaignCookieId: null,
          fragments: {},
          segmentApiCalls: {
            queuedEvent: {
              eventType: 'track',
              payload: {
                event: 'Queued Event',
                timestamp: '2026-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    const mmc = versionedData.data.MetaMetricsController as Record<
      string,
      unknown
    >;
    expect(mmc.metaMetricsId).toBeUndefined();
    expect(mmc.participateInMetaMetrics).toBeUndefined();
    expect(mmc.segmentApiCalls).toBeUndefined();
    expect(mmc.completedMetaMetricsOnboarding).toBe(true);

    const ac = versionedData.data.AnalyticsController as {
      analyticsId: string;
      optedIn: boolean;
    };
    expect(ac.optedIn).toBe(true);
    expect(ac.analyticsId).toBe(metaMetricsId);
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('sets completedMetaMetricsOnboarding false when participateInMetaMetrics was null', async () => {
    const oldStorage: {
      meta: { version: number };
      data: Record<string, unknown>;
    } = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: null,
          metaMetricsId: null,
          latestNonAnonymousEventTimestamp: 0,
          eventsBeforeMetricsOptIn: [],
          tracesBeforeMetricsOptIn: [],
          traits: {},
          dataCollectionForMarketing: null,
          marketingCampaignCookieId: null,
          fragments: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    const mmc = versionedData.data.MetaMetricsController as Record<
      string,
      unknown
    >;
    expect(mmc.completedMetaMetricsOnboarding).toBe(false);
    const ac = versionedData.data.AnalyticsController as {
      analyticsId: string;
      optedIn: boolean;
    };
    expect(ac.optedIn).toBe(false);
    expect(ac.analyticsId).toBe('');
  });
});
