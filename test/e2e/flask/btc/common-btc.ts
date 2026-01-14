import { Mockttp } from 'mockttp';
import { regularDelayMs, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  mockBitcoinFeatureFlag,
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
  mockBlockHeight931551
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

export const SIGNED_MESSAGES_MOCK = {
  'wallet-standard': '2724869233025221621920421093532286127255141612424720818615921381191207251442501586115313322589232701841211498526164118447506531691441452531632515054170854923516144217244138526413321383814964922461752251001934510822017023317996175199153832039315615106711782001715754',
  'sats-connect': 'AkgwRQIhAPzY28zSXTXkPRv/jT3yLxRRVp/VUb/PGZD6nj2ZheFZAiBGuHmVVRoQKbgvMgY1qZCR/aP7MjaqVTHroSzZ9Io0QAEhAoomlUBc9q/hZMEtbNyq6bNgr8eZU8tdnA9qR7LIqzk2'
}

export async function withBtcAccountSnap(
  {
    title,
    numberOfAccounts = 0,
    dappPaths,
  }: {
    title?: string;
    numberOfAccounts?: number;
    dappPaths?: string[];
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
      dappOptions:
        Array.isArray(dappPaths) && dappPaths.length > 0
          ? { numberOfTestDapps: 0, customDappPaths: dappPaths }
          : { numberOfTestDapps: 1 },
      // Force multichain accounts State 2 for Bitcoin UI to be available in E2E
      forceBip44Version: false,
      // Ensure bitcoinAccounts flag is enabled at runtime regardless of remote fetch
      manifestFlags: {
        remoteFeatureFlags: {
          bitcoinAccounts: { enabled: true, minimumVersion: '0.0.0' },
        },
      },
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockBitcoinFeatureFlag(mockServer),
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
        
        // See: PROD_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'api'),
        // See: UAT_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'uat-api'),
        await mockPriceMulti(mockServer),
        await mockPriceMultiBtcAndSol(mockServer),
      ],
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await loginWithBalanceValidation(driver);

      // const headerComponent = new HeaderNavbar(driver);
      // const assetList = new AssetListPage(driver);
      // const accountListPage = new AccountListPage(driver);

      // for (let i = 1; i <= numberOfAccounts; i++) {
      //   await headerComponent.openAccountMenu();
      //   await accountListPage.addAccount({
      //     accountType: ACCOUNT_TYPE.Bitcoin,
      //     accountName: `Bitcoin ${i}`,
      //   });
      //   await new NonEvmHomepage(driver).checkPageIsLoaded();
      //   await headerComponent.checkAccountLabel(`Bitcoin ${i}`);
      //   await assetList.checkNetworkFilterText('Bitcoin');
      // }

      // if (numberOfAccounts > 0) {
      //   await headerComponent.checkAccountLabel(`Bitcoin ${numberOfAccounts}`);
      // }

      await driver.delay(regularDelayMs); // workaround to avoid flakiness
      await test(driver, mockServer);
    },
  );
}
