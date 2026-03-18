/* eslint-disable mocha/no-skipped-tests */
import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  createDappTransaction,
  createInternalTransaction,
} from '../../page-objects/flows/transaction';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';
import { mockGetTxStatus } from '../bridge/bridge-test-utils';
import { mockSpotPrices } from '../tokens/utils/mocks';
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
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withNetworkControllerOnMainnet()
        .withEnabledNetworks({
          eip155: {
            '0x1': true,
          },
        })
        .build(),
      title,
      localNodeOptions: {
        hardfork: 'london',
        chainId: '1',
      },
      manifestFlags: {
        remoteFeatureFlags: {
          bridgeConfig: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        },
      },
      testSpecificMock,
      ignoredConsoleErrors,
    },
    async ({ driver }) => {
      await loginWithBalanceValidation(
        driver,
        undefined,
        undefined,
        expectedBalance,
      );
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
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
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
        await createInternalTransaction({
          driver,
          chainId: '0x1',
          symbol: 'ETH',
          amount: '0.01',
        });

        await transactionConfirmation.selectTokenFee('USDC');
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity(1);
        await activityList.checkNoFailedTransactions();
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAmountInActivity(`-0.01 ETH`, 1);
      },
    );
  });

  it('should Swap using smart transaction', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
          await mockSmartTransactionRequests(mockServer);
          await mockSwapTokensMockApis(mockServer);
          await mockGetTxStatus(mockServer);
        },
      },
      async ({ driver }) => {
        const homePage = new HomePage(driver);
        await homePage.checkIfSwapButtonIsClickable();
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

        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity();
        await activityList.checkNoFailedTransactions();
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAction({ action: 'Swap ETH to DAI' });
        await activityList.checkTxAmountInActivity(`-2 ETH`, 1);
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
        await homePage.checkIfSwapButtonIsClickable();
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

        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity();
        await activityList.checkNoFailedTransactions();
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
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

        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity();
        await activityList.checkNoFailedTransactions();
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
      },
    );
  });
});
