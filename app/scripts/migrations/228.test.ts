import { cloneDeep } from 'lodash';
import { migrate, version } from './228';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('moves marketing consent from MetaMetricsController to AnalyticsController', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          dataCollectionForMarketing: true,
          marketingCampaignCookieId: 'cookie-id',
        },
        AnalyticsController: {
          optedIn: true,
          consentDecisionMade: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({
      marketingCampaignCookieId: 'cookie-id',
    });
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      optedIn: true,
      consentDecisionMade: true,
      optedInToMarketing: true,
      marketingConsentDecisionMade: true,
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('creates AnalyticsController state when it is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          dataCollectionForMarketing: false,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      optedInToMarketing: false,
      marketingConsentDecisionMade: true,
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('does nothing when dataCollectionForMarketing is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          marketingCampaignCookieId: null,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('removes dataCollectionForMarketing without copying it when it is not boolean', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          dataCollectionForMarketing: null,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
    expect(versionedData.data).not.toHaveProperty('AnalyticsController');
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(false);
  });
});
