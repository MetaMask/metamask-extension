import { Mockttp } from 'mockttp';
import { regularDelayMs, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import {
  mockBitcoinFeatureFlag,
  mockExchangeRates,
  mockInitialFullScan,
  mockRampsDynamicFeatureFlag,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

export async function withBtcAccountSnap(
  {
    title,
    numberOfAccounts = 1,
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
      forceBip44Version: false,
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
      forceBip44Version: 2,
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

      const headerComponent = new HeaderNavbar(driver);
      const assetList = new AssetListPage(driver);
      const accountListPage = new AccountListPage(driver);

      for (let i = 1; i <= numberOfAccounts; i++) {
        await headerComponent.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Bitcoin,
          accountName: `Bitcoin ${i}`,
        });
        await new NonEvmHomepage(driver).checkPageIsLoaded();
        await headerComponent.checkAccountLabel(`Bitcoin ${i}`);
        await assetList.checkNetworkFilterText('Bitcoin');
      }

      if (numberOfAccounts > 0) {
        await headerComponent.checkAccountLabel(`Bitcoin ${numberOfAccounts}`);
      }

      await driver.delay(regularDelayMs); // workaround to avoid flakiness
      await test(driver, mockServer);
    },
  );
}
