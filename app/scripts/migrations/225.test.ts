import { cloneDeep } from 'lodash';
import { migrate, version } from './225';

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

  it('removes fragments from MetaMetricsController', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        MetaMetricsController: {
          fragments: {
            'transaction-ui-1': { id: 'transaction-ui-1', properties: {} },
          },
          dataCollectionForMarketing: false,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.MetaMetricsController).toStrictEqual({
      dataCollectionForMarketing: false,
    });
    expect(changedControllers.has('MetaMetricsController')).toBe(true);
  });

  it('leaves MetaMetricsController untouched when it has no fragments', async () => {
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

    expect(versionedData.data.MetaMetricsController).toStrictEqual({
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
