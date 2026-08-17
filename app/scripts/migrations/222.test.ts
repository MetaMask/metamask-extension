import { migrate, version } from './222';

const oldVersion = 221;
const newVersion = version;

describe('migration #222', () => {
  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);
    expect(newState.meta.version).toBe(newVersion);
  });

  it('removes the scan caches from PhishingController state', async () => {
    const oldState = {
      meta: { version: oldVersion },
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

    const newState = await migrate(oldState);

    expect(newState.data.PhishingController).toStrictEqual({
      c2DomainBlocklistLastFetched: 1757993558,
      hotlistLastFetched: 1757993558,
      phishingLists: [{ name: 'MetaMask' }],
      stalelistLastFetched: 1755694779,
      whitelist: [],
      whitelistPaths: {},
    });
  });

  it('does nothing if the scan caches do not exist', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PhishingController: {
          phishingLists: [],
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data.PhishingController).toStrictEqual({
      phishingLists: [],
    });
  });

  it('does nothing if PhishingController state is missing', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        OtherController: {},
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data).toStrictEqual({
      OtherController: {},
    });
  });

  it('does nothing if PhishingController state is not an object', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PhishingController: 'not an object',
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data).toStrictEqual({
      PhishingController: 'not an object',
    });
  });
});
