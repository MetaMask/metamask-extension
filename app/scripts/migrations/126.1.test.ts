import { List } from '@material-ui/core';
import { migrate, version } from './126.1';
import {
  PhishingControllerState,
  PhishingListState,
  ListNames,
} from '@metamask/phishing-controller';

const oldVersion = 126.1;

const mockPhishingListMetaMask: PhishingListState = {
  allowlist: [],
  blocklist: ['malicious1.com'],
  c2DomainBlocklist: ['malicious2.com'],
  fuzzylist: [],
  tolerance: 0,
  version: 1,
  lastUpdated: Date.now(),
  name: ListNames.MetaMask,
};

const mockPhishingListPhishfort: PhishingListState = {
  allowlist: [],
  blocklist: ['phishfort1.com'],
  c2DomainBlocklist: ['phishfort2.com'],
  fuzzylist: [],
  tolerance: 0,
  version: 1,
  lastUpdated: Date.now(),
  name: 'Phishfort' as ListNames,
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
      } as PhishingControllerState,
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    const updatedPhishingController = transformedState.data
      .PhishingController as PhishingControllerState;

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
      } as PhishingControllerState,
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    const updatedPhishingController = transformedState.data
      .PhishingController as PhishingControllerState;

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
      } as PhishingControllerState,
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    const updatedPhishingController = transformedState.data
      .PhishingController as PhishingControllerState;

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
});
