/* eslint-disable mocha/no-skipped-tests */
import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { unlockWallet, WINDOW_TITLES, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { createDappTransaction } from '../../page-objects/flows/transaction';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import { TX_SENTINEL_URL } from '../../../../shared/constants/transaction';
import {
  mockSmartTransactionRequests,
  mockGasIncludedTransactionRequests,
  mockChooseGasFeeTokenRequests,
} from './mocks';

async function withFixturesForSmartTransactions(
  {
    title,
    testSpecificMock,
  }: {
    title?: string;
    testSpecificMock: (mockServer: MockttpServer) => Promise<void>;
  },
  runTestWithFixtures: (args: { driver: Driver }) => Promise<void>,
) {
  await withFixtures(
    {
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
      testSpecificMock,
      dapp: true,
    },
    async ({ driver }) => {
      await unlockWallet(driver);
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
      },
      async ({ driver }) => {
        const homePage = new HomePage(driver);
        await homePage.checkExpectedTokenBalanceIsDisplayed('20', 'ETH');
        await homePage.checkIfSendButtonIsClickable();
        await homePage.startSendFlow();

        // fill ens address as recipient when user lands on send token screen
        const sendPage = new SendTokenPage(driver);
        await sendPage.checkPageIsLoaded();
        await sendPage.selectRecipientAccount('Account 1');
        await sendPage.fillAmount('.01');

        await sendPage.clickContinueButton();
        await sendPage.selectTokenFee('USDC');
        await driver.delay(1000);
        await sendPage.clickConfirmButton();
        await sendPage.clickViewActivity();

        const activityList = new ActivityListPage(driver);
        await activityList.checkNoFailedTransactions();
        // At the moment, there is 1 Sent and 1 Unnamed transaction (issue #35565)
        // The fix will consolidate the 2 into 1 tx
        await activityList.checkTxAction({
          action: 'Sent',
          txIndex: 2,
          completedTxs: 2,
        });
        await activityList.checkTxAmountInActivity(`-0 ETH`, 1);
        await activityList.checkTxAmountInActivity(`-0.01 ETH`, 2);
      },
    );
  });

  it.skip('should Swap using smart transaction', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockSmartTransactionRequests,
      },
      async ({ driver }) => {
        const homePage = new HomePage(driver);
        await homePage.checkExpectedTokenBalanceIsDisplayed('20', 'ETH');
        await homePage.checkIfSwapButtonIsClickable();
        await homePage.startSwapFlow();

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();
        await swapPage.enterSwapAmount('2');
        await swapPage.selectDestinationToken('DAI');

        await swapPage.dismissManualTokenWarning();
        await driver.delay(1500);
        await swapPage.submitSwap();

        await swapPage.waitForSmartTransactionToComplete('DAI');

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

  it.skip('should Swap with gas included fee', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockGasIncludedTransactionRequests,
      },
      async ({ driver }) => {
        const homePage = new HomePage(driver);
        await homePage.checkExpectedTokenBalanceIsDisplayed('20', 'ETH');
        await homePage.checkIfSwapButtonIsClickable();
        await homePage.startSwapFlow();

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();
        await swapPage.enterSwapAmount('20');
        await swapPage.checkQuoteIsGasIncluded();

        await swapPage.dismissManualTokenWarning();
        await driver.delay(1500);
        await swapPage.submitSwap();

        await swapPage.waitForSmartTransactionToComplete('USDC');

        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity();
        await activityList.checkNoFailedTransactions();
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
      },
    );
  });

  it.skip('should execute a dApp Transaction', async function () {
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

async function mockSentinelNetworks(mockServer: MockttpServer) {
  await mockServer
    .forGet(`${TX_SENTINEL_URL}/networks`)
    .always()
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          '1': {
            network: 'ethereum-mainnet',
            confirmations: true,
            relayTransactions: true,
            sendBundle: true,
          },
        },
      };
    });
}
