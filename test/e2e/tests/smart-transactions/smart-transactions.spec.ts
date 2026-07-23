import { MockttpServer } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import {
  createDappTransaction,
  createInternalTransaction,
} from '../../page-objects/flows/transaction.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';
import { mockGetTxStatus } from '../bridge/bridge-test-utils';
import {
  mockSpotPrices,
  getMainnet25EthAssetsControllerPatch,
} from '../tokens/utils/mocks';
import {
  mockSmartTransactionRequests,
  mockGasIncludedTransactionRequests,
  mockChooseGasFeeTokenRequests,
  mockSwapTokensMockApis,
  mockSentinelNetworks,
} from './mocks';

async function withFixturesForSmartTransactions(
  {
    title,
    testSpecificMock,
    ignoredConsoleErrors,
    expectedBalance = '20 ETH',
  }: {
    title?: string;
    testSpecificMock: (mockServer: MockttpServer) => Promise<void>;
    ignoredConsoleErrors?: string[];
    expectedBalance?: string;
  },
  runTestWithFixtures: (args: { driver: Driver }) => Promise<void>,
) {
  await withFixtures(
    {
      dappOptions: { numberOfTestDapps: 1 },
      fixtures: new FixtureBuilderV2()
        .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
        .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
        .withEnabledNetworks({
          eip155: {
            '0x1': true,
          },
        })
        .withAssetsController(
          getMainnet25EthAssetsControllerPatch(
            1700,
            DEFAULT_FIXTURE_ACCOUNT_ID,
            '20',
          ),
        )
        .build(),
      title,
      localNodeOptions: {
        hardfork: 'london',
        chainId: '1',
      },
      unifiedEvmAccountsApiBalances: {
        mainnetNativeEthHuman: '20',
      },
      manifestFlags: {
        remoteFeatureFlags: {
          bridgeConfig: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        },
      },
      testSpecificMock: async (mockServer: MockttpServer) => {
        await mockSpotPrices(mockServer, {
          'eip155:1/slip44:60': {
            price: 1700,
            marketCap: 382623505141,
            pricePercentChange1d: 0,
          },
        });
        await testSpecificMock(mockServer);
      },
      ignoredConsoleErrors,
    },
    async ({ driver }) => {
      await login(driver, {
        expectedBalance,
        waitForNonEvmAccounts: false,
      });
      await runTestWithFixtures({ driver });
    },
  );
}

describe('Smart Transactions', function () {
  it('should send transaction using USDC to pay fee', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockChooseGasFeeTokenRequests(mockServer);
          await mockSentinelNetworks(mockServer);
        },
        ignoredConsoleErrors: [
          // TODO: Remove after bug is fixed, tracked here: https://github.com/MetaMask/metamask-extension/issues/39370
          'useTransactionDisplayData does not recognize transaction type. Type received is: gas_payment',
        ],
      },
      async ({ driver }) => {
        // fill ens address as recipient when user lands on send token screen
        const transactionConfirmation = new TransactionConfirmation(driver);
        const homePage = new HomePage(driver);
        const activityTab = new ActivityTab(driver);

        await createInternalTransaction({
          driver,
          chainId: '0x1',
          symbol: 'ETH',
          amount: '0.01',
        });

        await transactionConfirmation.selectTokenFee('USDC');
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await homePage.goToActivityList();
        await activityTab.checkCompletedTxNumberDisplayedInActivity(1);
        await activityTab.checkNoFailedTransactions();
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkTxAmountInActivity(`-0.01 ETH`, 1);
      },
    );
  });

  it('should Swap using smart transaction', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSmartTransactionRequests(mockServer);
          await mockSwapTokensMockApis(mockServer);
          await mockGetTxStatus(mockServer);
        },
      },
      async ({ driver }) => {
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();
        await swapPage.enterSwapAmount('2');
        await swapPage.selectDestinationToken('DAI');
        await swapPage.checkQuoteIsGasIncluded();
        await swapPage.submitSwap();

        await swapPage.waitForSmartTransactionToComplete();
        await swapPage.clickViewActivity();

        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedTxNumberDisplayedInActivity();
        await activityTab.checkNoFailedTransactions();
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
        await activityTab.checkTxAction({ action: 'Swapped' });
        await activityTab.checkTxAmountInActivity(`+4,625.9799 DAI`, 1);
      },
    );
  });

  it('should Swap with gas included fee', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockGasIncludedTransactionRequests,
      },
      async ({ driver }) => {
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();
        await swapPage.enterSwapAmount('20');
        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsGasIncluded();
        await swapPage.submitSwap();

        await swapPage.waitForSmartTransactionToComplete();
        await swapPage.clickViewActivity();

        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedTxNumberDisplayedInActivity();
        await activityTab.checkNoFailedTransactions();
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
      },
    );
  });

  it('should execute a dApp Transaction', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockSmartTransactionRequests,
      },
      async ({ driver }) => {
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.clickFooterConfirmButton();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedTxNumberDisplayedInActivity();
        await activityTab.checkNoFailedTransactions();
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
      },
    );
  });
});
