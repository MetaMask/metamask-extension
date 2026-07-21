import { cloneDeep } from 'lodash';
import { migrate, version } from './219';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-28T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('moves completedMetaMetricsOnboarding=true to AnalyticsController.consentDecisionMade', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          completedMetaMetricsOnboarding: true,
          eventsBeforeMetricsOptIn: [],
          fragments: {},
        },
        AnalyticsController: {
          analyticsId: '0xabc123',
          optedIn: true,
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
    const ac = versionedData.data.AnalyticsController as Record<
      string,
      unknown
    >;

    expect(mmc.completedMetaMetricsOnboarding).toBeUndefined();
    expect(mmc.eventsBeforeMetricsOptIn).toBeUndefined();
    expect(ac.consentDecisionMade).toBe(true);
    // Existing AnalyticsController fields are preserved.
    expect(ac.analyticsId).toBe('0xabc123');
    expect(ac.optedIn).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
  });

  it('sets consentDecisionMade=false when the user opted out', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: { completedMetaMetricsOnboarding: false },
        AnalyticsController: { analyticsId: '0xabc123', optedIn: false },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    const ac = versionedData.data.AnalyticsController as Record<
      string,
      unknown
    >;
    expect(ac.consentDecisionMade).toBe(false);
  });

  it('transforms a normal buffered event into a single preConsentEventQueue entry', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          completedMetaMetricsOnboarding: false,
          eventsBeforeMetricsOptIn: [
            {
              event: 'App Installed',
              category: 'App',
              properties: { source: 'onboarding' },
            },
          ],
        },
        AnalyticsController: { analyticsId: '0xabc123', optedIn: false },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    const mmc = versionedData.data.MetaMetricsController as Record<
      string,
      unknown
    >;
    const ac = versionedData.data.AnalyticsController as {
      preConsentEventQueue: Record<string, unknown>;
    };

    expect(mmc.eventsBeforeMetricsOptIn).toBeUndefined();
    const entries = Object.values(ac.preConsentEventQueue);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toStrictEqual({
      type: 'track',
      eventName: 'App Installed',
      messageId: expect.any(String),
      timestamp: '2026-05-28T00:00:00.000Z',
      properties: {
        source: 'onboarding',
        category: 'App',
      },
    });
  });

  it('splits a buffered event with sensitiveProperties into regular and anonymous entries', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          completedMetaMetricsOnboarding: false,
          eventsBeforeMetricsOptIn: [
            {
              event: 'App Installed',
              category: 'App',
              properties: { source: 'onboarding' },
              sensitiveProperties: { secret: 'value' },
            },
          ],
        },
        AnalyticsController: { analyticsId: '0xabc123', optedIn: false },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    const mmc = versionedData.data.MetaMetricsController as Record<
      string,
      unknown
    >;
    const ac = versionedData.data.AnalyticsController as {
      preConsentEventQueue: Record<string, unknown>;
    };

    expect(mmc.eventsBeforeMetricsOptIn).toBeUndefined();
    const entries = Object.values(ac.preConsentEventQueue);
    expect(entries).toHaveLength(2);
    expect(entries).toStrictEqual(
      expect.arrayContaining([
        {
          type: 'track',
          eventName: 'App Installed',
          messageId: expect.any(String),
          timestamp: '2026-05-28T00:00:00.000Z',
          properties: {
            source: 'onboarding',
            category: 'App',
          },
        },
        {
          type: 'track',
          eventName: 'App Installed',
          messageId: expect.any(String),
          timestamp: '2026-05-28T00:00:00.000Z',
          properties: {
            source: 'onboarding',
            secret: 'value',
            category: 'App',
            anonymous: true,
          },
        },
      ]),
    );
  });

  it('does not create a preConsentEventQueue when there are no buffered events', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          completedMetaMetricsOnboarding: true,
          eventsBeforeMetricsOptIn: [],
        },
        AnalyticsController: { analyticsId: '0xabc123', optedIn: true },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    const ac = versionedData.data.AnalyticsController as Record<
      string,
      unknown
    >;
    expect(ac.preConsentEventQueue).toBeUndefined();
  });

  it('skips malformed buffered entries', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          completedMetaMetricsOnboarding: false,
          eventsBeforeMetricsOptIn: [
            'not-an-object',
            { properties: { no: 'event name' } },
            { event: 'Valid Event' },
          ],
        },
        AnalyticsController: { analyticsId: '0xabc123', optedIn: false },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    const ac = versionedData.data.AnalyticsController as {
      preConsentEventQueue: Record<string, unknown>;
    };
    const entries = Object.values(ac.preConsentEventQueue);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ eventName: 'Valid Event' });
  });

  it('creates AnalyticsController if absent and defaults consentDecisionMade to false', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    const ac = versionedData.data.AnalyticsController as Record<
      string,
      unknown
    >;
    expect(ac.consentDecisionMade).toBe(false);
  });

  it('does not throw when state is empty', async () => {
    const versionedData: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    expect(() => migrate(versionedData, new Set<string>())).not.toThrow();
  });
});
