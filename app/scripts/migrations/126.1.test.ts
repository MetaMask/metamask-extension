import { migrate, version } from './126.1';

const oldVersion = 126.1;

const mockPhishingListMetaMask = {
  allowlist: [],
  blocklist: ['malicious1.com'],
  c2DomainBlocklist: ['malicious2.com'],
  fuzzylist: [],
  tolerance: 0,
  version: 1,
  lastUpdated: Date.now(),
  name: 'MetaMask',
};

const mockPhishingListPhishfort = {
  allowlist: [],
  blocklist: ['phishfort1.com'],
  c2DomainBlocklist: ['phishfort2.com'],
  fuzzylist: [],
  tolerance: 0,
  version: 1,
  lastUpdated: Date.now(),
  name: 'Phishfort',
};

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('keeps only the MetaMask phishing list in PhishingControllerState', async () => {
    const oldState = {
      PhishingController: {
        phishingLists: [mockPhishingListMetaMask, mockPhishingListPhishfort],
        whitelist: [],
        hotlistLastFetched: 0,
        stalelistLastFetched: 0,
        c2DomainBlocklistLastFetched: 0,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    const updatedPhishingController = transformedState.data
      .PhishingController as Record<string, unknown>;

    expect(updatedPhishingController.phishingLists).toStrictEqual([
      mockPhishingListMetaMask,
    ]);
  });

  it('removes all phishing lists if MetaMask is not present', async () => {
    const oldState = {
      PhishingController: {
        phishingLists: [mockPhishingListPhishfort],
        whitelist: [],
        hotlistLastFetched: 0,
        stalelistLastFetched: 0,
        c2DomainBlocklistLastFetched: 0,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    const updatedPhishingController = transformedState.data
      .PhishingController as Record<string, unknown>;

    expect(updatedPhishingController.phishingLists).toStrictEqual([]);
  });

  it('does nothing if PhishingControllerState is empty', async () => {
    const oldState = {
      PhishingController: {
        phishingLists: [],
        whitelist: [],
        hotlistLastFetched: 0,
        stalelistLastFetched: 0,
        c2DomainBlocklistLastFetched: 0,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    const updatedPhishingController = transformedState.data
      .PhishingController as Record<string, unknown>;

    expect(updatedPhishingController.phishingLists).toStrictEqual([]);
  });

  it('does nothing if PhishingController is not in the state', async () => {
    const oldState = {
      NetworkController: {
        providerConfig: {
          chainId: '0x1',
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('does nothing if phishingLists is not an array (null)', async () => {
    const oldState: Record<string, unknown> = {
      PhishingController: {
        phishingLists: null,
        whitelist: [],
        hotlistLastFetched: 0,
        stalelistLastFetched: 0,
        c2DomainBlocklistLastFetched: 0,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });
});
