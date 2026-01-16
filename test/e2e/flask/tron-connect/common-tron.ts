import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import Homepage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { DAPP_PATH } from '../../constants';
import { mockTronFeatureFlag } from './mocks/feature-flag';
import {
  mockExchangeRates,
  mockHistoricalPrices1d,
  mockHistoricalPrices7d,
  mockAccountRequest,
  mockTransactionsRequest,
  mockTransactionsTRC20Request,
  mockExchangeRatesV1,
  mockAccountResourcesRequest,
  mockTokens,
  mockGetBlock,
  mockScanTransaction,
  mockBroadcastTransaction,
  mockTriggerSmartContract,
} from './mocks';

export const TRANSACTION_HASH_MOCK =
  '36c4096d30a82641ee9d8c12297ed330ddb0f8ae272dc2564995de7a4201a67e';

export const DEFAULT_MESSAGE_SIGNATURE =
  '0xa92e82ed84ec0b7a7f061948e27feb0d0ad2c2cb474aaa1a1660f13a76240aa709b248f83c17600a35a7f6ceca6d952483515196268a6306c9496a3e578fd7af1c';

export const withTronAccountSnap = async (
  {
    title,
    numberOfAccounts = 1,
    dappOptions,
  }: {
    title?: string;
    numberOfAccounts?: number;
    dappOptions?: {
      numberOfTestDapps?: number;
      customDappPaths?: string[];
    };
  },
  test: (driver: Driver) => Promise<void>,
) => {
  await withFixtures(
    {
      forceBip44Version: false,
      fixtures: new FixtureBuilder()
        .withEnabledNetworks({
          tron: {
            [MultichainNetworks.TRON]: true,
            [MultichainNetworks.TRON_NILE]: true,
            [MultichainNetworks.TRON_SHASTA]: true,
          },
          eip155: {
            '0x539': true,
          },
        })
        .build(),
      title,
      dapp: true,
      dappOptions: dappOptions ?? {
        numberOfTestDapps: 1,
        customDappPaths: [DAPP_PATH.TEST_DAPP_TRON],
      },
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockTronFeatureFlag(mockServer),
        await mockExchangeRates(mockServer),
        await mockExchangeRatesV1(mockServer),
        await mockHistoricalPrices1d(mockServer),
        await mockHistoricalPrices7d(mockServer),
        await mockAccountRequest(mockServer),
        await mockTransactionsRequest(mockServer),
        await mockTransactionsTRC20Request(mockServer),
        await mockAccountResourcesRequest(mockServer),
        await mockTokens(mockServer),
        await mockGetBlock(mockServer),
        await mockScanTransaction(mockServer),
        await mockBroadcastTransaction(mockServer),
        await mockTriggerSmartContract(mockServer),
      ],
    },
    async ({ driver }: { driver: Driver }) => {
      await loginWithBalanceValidation(driver);

      const accountListPage = new AccountListPage(driver);

      for (let i = 0; i < numberOfAccounts; i++) {
        const homepage = new Homepage(driver);
        await homepage.checkExpectedBalanceIsDisplayed();
        // create account
        await homepage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
      }

      await accountListPage.selectAccount('Account 1');

      await test(driver);
    },
  );
};
