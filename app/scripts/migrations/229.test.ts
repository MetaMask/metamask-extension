import { cloneDeep } from 'lodash';
import { migrate, version } from './229';

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

  it('moves the marketing campaign cookie id from MetaMetricsController to AnalyticsController', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          marketingCampaignCookieId: 'cookie-id',
        },
        AnalyticsController: {
          optedIn: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      optedIn: true,
      marketingCampaignCookieId: 'cookie-id',
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('removes the marketing campaign cookie id without copying it when it is null', async () => {
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

    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
    expect(versionedData.data).not.toHaveProperty('AnalyticsController');
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(false);
  });

  it('moves a numeric marketing campaign cookie id from MetaMetricsController to AnalyticsController', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          marketingCampaignCookieId: 12345,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      marketingCampaignCookieId: 12345,
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('removes an empty string marketing campaign cookie id without copying it', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          marketingCampaignCookieId: '',
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

  it('does nothing when MetaMetricsController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AnalyticsController: {
          optedIn: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when marketingCampaignCookieId is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          someOtherProperty: 'some-value',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('creates AnalyticsController state when it is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          marketingCampaignCookieId: 'cookie-id',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      marketingCampaignCookieId: 'cookie-id',
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });

  it('preserves existing AnalyticsController state when moving the marketing campaign cookie id', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
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

    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      optedIn: true,
      consentDecisionMade: true,
      marketingCampaignCookieId: 'cookie-id',
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AnalyticsController')).toBe(true);
  });
});
