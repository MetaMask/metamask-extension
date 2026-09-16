import { cloneDeep } from 'lodash';
import { MetaMetricsUserTrait } from '../../../shared/constants/metametrics';
import { migrate, version } from './226';

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

  it('moves cookie traits to AppMetadataController.installAttribution', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AppMetadataController: {
          currentAppVersion: '13.0.0',
        },
        MetaMetricsController: {
          dataCollectionForMarketing: true,
          marketingCampaignCookieId: 'campaign-id',
          tracesBeforeMetricsOptIn: [],
          traits: {
            [MetaMetricsUserTrait.CookieId]: 'GA1.1.12345.67890',
            [MetaMetricsUserTrait.GaClientId]: '12345.67890',
            [MetaMetricsUserTrait.InstallDateExt]: '2024-01-15',
            [MetaMetricsUserTrait.StorageKind]: 'split',
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({
      dataCollectionForMarketing: true,
      marketingCampaignCookieId: 'campaign-id',
      tracesBeforeMetricsOptIn: [],
    });
    expect(versionedData.data.AppMetadataController).toStrictEqual({
      currentAppVersion: '13.0.0',
      installAttribution: {
        cookieId: 'GA1.1.12345.67890',
        gaClientId: '12345.67890',
      },
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
    expect(changedControllers.has('AppMetadataController')).toBe(true);
  });

  it('omits gaClientId when traits.ga_client_id is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          traits: {
            [MetaMetricsUserTrait.CookieId]: 'malformed-ga-cookie',
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.data.AppMetadataController).toStrictEqual({
      installAttribution: {
        cookieId: 'malformed-ga-cookie',
      },
    });
  });

  it('does not set installAttribution when cookie_id is absent', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AppMetadataController: {
          currentAppVersion: '13.0.0',
        },
        MetaMetricsController: {
          traits: {
            [MetaMetricsUserTrait.InstallDateExt]: '2024-01-15',
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.data.AppMetadataController).toStrictEqual({
      currentAppVersion: '13.0.0',
    });
    expect(versionedData.data.MetaMetricsController).toStrictEqual({});
  });

  it('leaves MetaMetricsController untouched when it has no traits', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          tracesBeforeMetricsOptIn: [],
          dataCollectionForMarketing: false,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({
      tracesBeforeMetricsOptIn: [],
      dataCollectionForMarketing: false,
    });
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when MetaMetricsController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: { AnalyticsController: { optedIn: true } },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when MetaMetricsController is not an object', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: { MetaMetricsController: 'not-an-object' },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });
});
