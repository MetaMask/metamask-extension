import { cloneDeep } from 'lodash';
import { migrate, version } from './224';

const VERSION = version;
const PREVIOUS_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('removes the scan caches from PhishingController state', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        PhishingController: {
          c2DomainBlocklistLastFetched: 1757993558,
          hotlistLastFetched: 1757993558,
          phishingLists: [{ name: 'MetaMask' }],
          stalelistLastFetched: 1755694779,
          whitelist: [],
          whitelistPaths: {},
          urlScanCache: {
            'app.uniswap.org': {
              data: {
                hostname: 'app.uniswap.org',
                recommendedAction: 'VERIFIED',
              },
              timestamp: 1757993550,
            },
          },
          tokenScanCache: {
            '0x1:0x1234567890123456789012345678901234567890': {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              data: { result_type: 'Benign' },
              timestamp: 1757993550,
            },
          },
          addressScanCache: {
            '0x1:0x1234567890123456789012345678901234567890': {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              data: { result_type: 'Benign', label: '' },
              timestamp: 1757993550,
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.PhishingController).toStrictEqual({
      c2DomainBlocklistLastFetched: 1757993558,
      hotlistLastFetched: 1757993558,
      phishingLists: [{ name: 'MetaMask' }],
      stalelistLastFetched: 1755694779,
      whitelist: [],
      whitelistPaths: {},
    });
    expect(changedControllers.has('PhishingController')).toBe(true);
  });

  it('does nothing if the scan caches do not exist', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        PhishingController: {
          phishingLists: [],
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data.PhishingController).toStrictEqual({
      phishingLists: [],
    });
    expect(changedControllers.has('PhishingController')).toBe(false);
  });

  it('does nothing if PhishingController state is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        OtherController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({
      OtherController: {},
    });
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if PhishingController state is not an object', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        PhishingController: 'not an object',
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({
      PhishingController: 'not an object',
    });
    expect(changedControllers.size).toBe(0);
  });
});
