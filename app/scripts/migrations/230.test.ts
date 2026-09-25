import { cloneDeep } from 'lodash';
import { migrate, version } from './230';

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
      data: {
        MetaMetricsController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('deletes the empty MetaMetricsController key and leaves sibling controllers untouched', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {},
        AnalyticsController: {
          optedIn: true,
          analyticsId: 'test-analytics-id',
        },
        PreferencesController: {
          infuraBlocked: false,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).not.toHaveProperty('MetaMetricsController');
    expect(versionedData.data.AnalyticsController).toStrictEqual({
      optedIn: true,
      analyticsId: 'test-analytics-id',
    });
    expect(versionedData.data.PreferencesController).toStrictEqual({
      infuraBlocked: false,
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
  });

  it('deletes the whole MetaMetricsController key even when it contains fields', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          someLegacyField: 'legacy-value',
          anotherLegacyField: 42,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).not.toHaveProperty('MetaMetricsController');
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
  });

  it('returns state unchanged when MetaMetricsController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        AnalyticsController: {
          optedIn: false,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('MetaMetricsController')).toBe(false);
  });
});
