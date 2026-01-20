import { migrate, version } from './179';

const oldVersion = 178;
const newVersion = version;

describe('migration #179', () => {
  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);
    expect(newState.meta.version).toBe(newVersion);
  });

  it('clears urlScanCache when it exists', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PhishingController: {
          c2DomainBlocklistLastFetched: 1757993558,
          hotlistLastFetched: 1757993558,
          phishingLists: [{ name: 'metamask' }],
          stalelistLastFetched: 1755694779,
          tokenScanCache: {},
          urlScanCache: {
            'app.uniswap.org': {
              data: {
                hostname: 'app.uniswap.org',
                recommendedAction: 'VERIFIED',
              },
              timestamp: 1757993550,
            },
            'img.reservoir.tools': {
              result: { recommendedAction: 'NONE' },
              timestamp: 1757352398,
            },
            'metamask.github.io': {
              data: { hostname: 'metamask.github.io' },
              timestamp: 1757947364,
            },
            'opensea.io': {
              result: { recommendedAction: 'SAFE' },
              timestamp: 1757527040,
            },
            'portfolio.metamask.io': {
              result: { recommendedAction: 'SAFE' },
              timestamp: 1753231169,
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data.PhishingController).toStrictEqual({
      c2DomainBlocklistLastFetched: 1757993558,
      hotlistLastFetched: 1757993558,
      phishingLists: [{ name: 'metamask' }],
      stalelistLastFetched: 1755694779,
      tokenScanCache: {},
      urlScanCache: {},
    });
  });

  it('does nothing when urlScanCache does not exist', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PhishingController: {
          c2DomainBlocklistLastFetched: 1757993558,
          hotlistLastFetched: 1757993558,
          phishingLists: [{ name: 'metamask' }],
          stalelistLastFetched: 1755694779,
          tokenScanCache: {},
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data.PhishingController).toStrictEqual({
      c2DomainBlocklistLastFetched: 1757993558,
      hotlistLastFetched: 1757993558,
      phishingLists: [{ name: 'metamask' }],
      stalelistLastFetched: 1755694779,
      tokenScanCache: {},
    });
  });

  it('does nothing when PhishingController does not exist', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        OtherController: {
          someData: 'value',
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data).toStrictEqual({
      OtherController: {
        someData: 'value',
      },
    });
  });

  it('does nothing when PhishingController is not an object', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PhishingController: 'invalid',
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data).toStrictEqual({
      PhishingController: 'invalid',
    });
  });
});
