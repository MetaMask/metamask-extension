import { Mockttp } from 'mockttp';
import { regularDelayMs, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { addMultipleAccounts } from '../../page-objects/flows/add-account.flow';
import FixtureBuilder from '../../fixtures/fixture-builder-v2';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  mockExchangeRates,
  mockInitialFullScan,
  mockRampsDynamicFeatureFlag,
  mockGetUtxos,
  mockGetBlocks,
  mockFeeEstimates,
  mockScripthashTxs,
  mockBlockHeight,
  mockGetUtxosMainnet,
  mockFeeEstimatesMainnet,
  mockGetTxHex,
  mockGetTxHexMainnet,
  mockScripthashTxs2,
  mockBlockHeight0,
  mockBlockHeight931551,
} from '../../tests/btc/mocks';
import { WalletConnectionType } from '../../page-objects/pages/test-dapp-bitcoin';
import {
  DAPP_PATH,
  DEFAULT_BTC_ADDRESS,
  SECONDARY_BTC_ADDRESS,
} from '../../constants';
import {
  mockPriceMulti,
  mockPriceMultiBtcAndSol,
} from '../../tests/btc/mocks/min-api';

export const account1Short = `${DEFAULT_BTC_ADDRESS.slice(0, 4)}...${DEFAULT_BTC_ADDRESS.slice(-4)}`;
export const account2Short = `${SECONDARY_BTC_ADDRESS.slice(0, 4)}...${SECONDARY_BTC_ADDRESS.slice(-4)}`;
export const txHashShort = `d489...7f9d`;

export const psbt =
  'cHNidP8BAHECAAAAAZWJ25B394BrSQ65wNtwny+qxXez2vsQvaUn8WZmUQyfAQAAAAD/////AugDAAAAAAAAFgAUsXnj+ePQhyHrPBWaQ1JhLV1m8ZyI1/UFAAAAABYAFEaddug4fhHL6QEMcu5LdI3ZFS+lAAAAAAABAMECAAAAAAEBEXLSQnkwax1H8e/6rJXmytghfvqDx4g5A/BcQMOVoo0NAAAAAP3///8CnggAAAAAAAAWABRGnXboOH4Ry+kBDHLuS3SN2RUvpQWBIAAAAAAAIlEg7RKe4I4bra27T+dfOEchNHnda5rSEGJZ1VIIkdl/aBABQHupG8m5wmhyVfotju/RGyhjuuPe62jlP9SNxoymBT4LXut008rusTtuTBY+g2so7BknoqBnLg9VuFhgkxTSpoUAAAAAAAAA';
export const SIGNED_MESSAGES_MOCK: Record<WalletConnectionType, string> = {
  [WalletConnectionType.Standard]:
    '2724869233025221621920421093532286127255141612424720818615921381191207251442501586115313322589232701841211498526164118447506531691441452531632515054170854923516144217244138526413321383814964922461752251001934510822017023317996175199153832039315615106711782001715754',
  [WalletConnectionType.SatsConnectV3]:
    'AkgwRQIhAPzY28zSXTXkPRv/jT3yLxRRVp/VUb/PGZD6nj2ZheFZAiBGuHmVVRoQKbgvMgY1qZCR/aP7MjaqVTHroSzZ9Io0QAEhAoomlUBc9q/hZMEtbNyq6bNgr8eZU8tdnA9qR7LIqzk2',
  [WalletConnectionType.SatsConnectV4]:
    'AkgwRQIhAPzY28zSXTXkPRv/jT3yLxRRVp/VUb/PGZD6nj2ZheFZAiBGuHmVVRoQKbgvMgY1qZCR/aP7MjaqVTHroSzZ9Io0QAEhAoomlUBc9q/hZMEtbNyq6bNgr8eZU8tdnA9qR7LIqzk2',
};

export const DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS = {
  dappOptions: {
    customDappPaths: [DAPP_PATH.TEST_DAPP_BITCOIN],
  },
};

export async function withBtcWalletStandardSnap(
  {
    title,
    dappOptions,
    numberOfAccounts = 1,
  }: {
    title?: string;
    dappOptions?: {
      numberOfTestDapps?: number;
      customDappPaths?: string[];
    };
    numberOfAccounts?: number;
  },
  test: (
    driver: Driver,
    mockServer?: Mockttp,
    extensionId?: string,
  ) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withEnabledNetworks({
          eip155: {
            '0x539': true,
          },
          bip122: {
            [MultichainNetworks.BITCOIN]: true,
            [MultichainNetworks.BITCOIN_TESTNET]: true,
            [MultichainNetworks.BITCOIN_SIGNET]: true,
          },
        })
        .build(),
      title,
      dapp: true,
      dappOptions: dappOptions ?? {
        numberOfTestDapps: 1,
        customDappPaths: [DAPP_PATH.TEST_DAPP_BITCOIN],
      },
      forceBip44Version: false,
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockInitialFullScan(mockServer),
        await mockExchangeRates(mockServer),

        await mockGetUtxos(mockServer),
        await mockGetBlocks(mockServer),
        await mockFeeEstimates(mockServer),
        await mockScripthashTxs(mockServer),
        await mockBlockHeight(mockServer),
        await mockBlockHeight0(mockServer),
        await mockBlockHeight931551(mockServer),
        await mockGetUtxosMainnet(mockServer),
        await mockFeeEstimatesMainnet(mockServer),
        await mockGetTxHex(mockServer),
        await mockGetTxHexMainnet(mockServer),
        await mockScripthashTxs2(mockServer),

        await mockRampsDynamicFeatureFlag(mockServer, 'api'),
        await mockRampsDynamicFeatureFlag(mockServer, 'uat-api'),
        await mockPriceMulti(mockServer),
        await mockPriceMultiBtcAndSol(mockServer),
      ],
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await login(driver);

      await driver.delay(regularDelayMs); // workaround to avoid flakiness

      await addMultipleAccounts({ driver, numberOfAccounts });

      await test(driver, mockServer);
    },
  );
}
