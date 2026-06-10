import { Mockttp } from 'mockttp';
import { regularDelayMs, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import Homepage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { DAPP_PATH } from '../../constants';
import {
  mockExchangeRates,
  mockFiatExchangeRates,
} from '../../tests/btc/mocks/price-api';
import {
  mockHorizonAccount,
  mockHorizonSubmitTransaction,
  mockHorizonTestnetAccount,
  mockHorizonTestnetSubmitTransaction,
  mockStellarFeatureFlag,
  mockStellarMessageScan,
  mockStellarStaticAssets,
  mockStellarTokens,
  mockStellarTransactionScan,
  mockStellarWalletIcons,
} from '../../tests/stellar/mocks';

export const DEFAULT_STELLAR_TEST_DAPP_FIXTURE_OPTIONS = {
  dappOptions: {
    customDappPaths: [DAPP_PATH.TEST_DAPP_STELLAR],
  },
};

export const clickConfirmButton = async (driver: Driver): Promise<void> => {
  await driver.clickElement({ text: 'Approve' });
};

export async function withStellarWalletSnap(
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
  test: (driver: Driver) => Promise<void>,
) {
  await withFixtures(
    {
      forceBip44Version: false,
      fixtures: new FixtureBuilderV2()
        .withEnabledNetworks({
          eip155: {
            '0x539': true,
          },
          stellar: {
            [MultichainNetworks.STELLAR]: true,
            [MultichainNetworks.STELLAR_TESTNET]: true,
          },
        })
        .build(),
      title,
      dapp: true,
      dappOptions: dappOptions ?? {
        numberOfTestDapps: 1,
        customDappPaths: [DAPP_PATH.TEST_DAPP_STELLAR],
      },
      manifestFlags: {
        remoteFeatureFlags: {
          stellarAccounts: { enabled: true, minimumVersion: '0.0.1' },
          sendRedesign: { enabled: false },
        },
      },
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockStellarFeatureFlag(mockServer),
        await mockHorizonAccount(mockServer),
        await mockHorizonTestnetAccount(mockServer),
        await mockHorizonSubmitTransaction(mockServer),
        await mockHorizonTestnetSubmitTransaction(mockServer),
        await mockStellarMessageScan(mockServer),
        await mockStellarTransactionScan(mockServer),
        await mockStellarTokens(mockServer),
        await mockStellarStaticAssets(mockServer),
        await mockStellarWalletIcons(mockServer),
        await mockExchangeRates(mockServer),
        await mockFiatExchangeRates(mockServer),
      ],
    },
    async ({ driver }: { driver: Driver }) => {
      await login(driver);
      await driver.delay(regularDelayMs);

      const accountListPage = new AccountListPage(driver);
      const homepage = new Homepage(driver);
      await homepage.checkExpectedBalanceIsDisplayed();

      for (let i = 0; i < numberOfAccounts; i++) {
        if (i === 0) {
          await homepage.headerNavbar.openAccountMenu();
        }

        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
      }

      await accountListPage.selectAccount('Account 1');

      await test(driver);
    },
  );
}
