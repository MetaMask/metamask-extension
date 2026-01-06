import { MockedEndpoint, Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { mockTronFeatureFlag } from './mocks/feature-flag';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import Homepage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  mockExchangeRates,
  mockPriceMulti,
  mockPriceMultiTrxAndSol,
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
  mockTriggerSmartContract
} from './mocks';

export const SIGNED_TRX_TRANSACTION_MOCK = {
  "visible": false,
  "txID": "36c4096d30a82641ee9d8c12297ed330ddb0f8ae272dc2564995de7a4201a67e",
  "raw_data_hex": "0a02de6322089618e1831602b14840faaaa08bb3335a68080112640a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412330a1541588c5216750cceaad16cf5a757e3f7b32835a5e112154132f9c0c487f21716b7a8f12906b752889902655818c0a9d33a709ad69c8bb333",
  "raw_data": {
    "contract": [
      {
        "parameter": {
          "value": {
            "to_address": "4132f9c0c487f21716b7a8f12906b7528899026558",
            "owner_address": "41588c5216750cceaad16cf5a757e3f7b32835a5e1",
            "amount": 123000000
          },
          "type_url": "type.googleapis.com/protocol.TransferContract"
        },
        "type": "TransferContract"
      }
    ],
    "ref_block_bytes": "de63",
    "ref_block_hash": "9618e1831602b148",
    "expiration": 1766060463482,
    "timestamp": 1766060403482
  },
  "signature": [
    "0xa117e16b43ebf04e6ca49109619014fbda8710bacc93e7b938f608853e697cad207ddf493c2f4016b5d798e64eadea914685aae506f4ad859e852bce8e1adb481C"
  ]
}

export const TRANSACTION_HASH_MOCK = "36c4096d30a82641ee9d8c12297ed330ddb0f8ae272dc2564995de7a4201a67e"

export const withTronAccountSnap = async ({
  title,
  numberOfAccounts = 1,
  dappPaths,
}: {
  title?: string;
  numberOfAccounts?: number;
  dappPaths?: string[];
}, test: (driver: Driver) => Promise<void>) => {
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
          bip122: {
            [MultichainNetworks.BITCOIN]: true,
          },
        })
        .build(),
      title: title,
      dapp: true,
      dappOptions: { numberOfTestDapps: 0, customDappPaths: dappPaths },
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockTronFeatureFlag(mockServer),
        await mockExchangeRates(mockServer),
        await mockExchangeRatesV1(mockServer),
        await mockPriceMulti(mockServer),
        await mockPriceMultiTrxAndSol(mockServer),
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
      ]
    },
    async ({ driver }: { driver: Driver }) => {
      await loginWithBalanceValidation(driver);

      if (numberOfAccounts === 2) {
        const homepage = new Homepage(driver);
        await homepage.checkExpectedBalanceIsDisplayed();
        // create 2nd account
        await homepage.headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.selectAccount('Account 1');
      }
      
      await test(driver);
    },
  );
};