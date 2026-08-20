import { cloneDeep } from 'lodash';
import { migrate, version } from './212';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-28T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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
                messageId: 'queuedEvent',
                event: 'Queued Event',
                timestamp: '2026-01-01T00:00:00.000Z',
                properties: {
                  category: 'Migration Test',
                },
                context: {
                  page: {
                    path: '/home',
                    title: 'Home',
                    url: 'https://metamask.io/home',
                  },
                },
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
      eventQueue: Record<string, unknown>;
      optedIn: boolean;
    };
    expect(ac.optedIn).toBe(true);
    expect(ac.analyticsId).toBe(metaMetricsId);
    expect(ac.eventQueue).toStrictEqual({
      queuedEvent: {
        type: 'track',
        eventName: 'Queued Event',
        messageId: 'queuedEvent',
        timestamp: '2026-01-01T00:00:00.000Z',
        properties: {
          category: 'Migration Test',
        },
        context: {
          page: {
            path: '/home',
            title: 'Home',
            url: 'https://metamask.io/home',
          },
        },
      },
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('migrates queued page, identify, and anonymous track calls to AnalyticsController eventQueue', async () => {
    const oldStorage: {
      meta: { version: number };
      data: Record<string, unknown>;
    } = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsId: '0xabc123',
          segmentApiCalls: {
            pageEvent: {
              eventType: 'page',
              payload: {
                name: 'Home',
                messageId: 'pageEvent',
                timestamp: '2026-01-01T00:00:00.000Z',
                properties: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  environment_type: 'background',
                },
              },
            },
            identifyEvent: {
              eventType: 'identify',
              payload: {
                userId: '0xabc123',
                messageId: 'identifyEvent',
                timestamp: '2026-01-02T00:00:00.000Z',
                traits: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  account_type: 'Default',
                },
              },
            },
            anonymousTrackEvent: {
              eventType: 'track',
              payload: {
                anonymousId: '00000000-0000-0000-0000-000000000000',
                event: 'Signature Requested Anon',
                messageId: 'anonymousTrackEvent',
                timestamp: '2026-01-03T00:00:00.000Z',
                properties: {
                  category: 'Signature',
                },
              },
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    const ac = versionedData.data.AnalyticsController as {
      eventQueue: Record<string, unknown>;
    };
    expect(ac.eventQueue).toStrictEqual({
      pageEvent: {
        type: 'view',
        name: 'Home',
        messageId: 'pageEvent',
        timestamp: '2026-01-01T00:00:00.000Z',
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
        },
      },
      identifyEvent: {
        type: 'identify',
        userId: '0xabc123',
        messageId: 'identifyEvent',
        timestamp: '2026-01-02T00:00:00.000Z',
        traits: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'Default',
        },
      },
      anonymousTrackEvent: {
        type: 'track',
        eventName: 'Signature Requested Anon',
        messageId: 'anonymousTrackEvent',
        timestamp: '2026-01-03T00:00:00.000Z',
        properties: {
          anonymous: true,
          category: 'Signature',
        },
      },
    });
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
