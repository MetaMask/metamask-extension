import { MockttpServer } from 'mockttp';
import {
  buildQuote,
  reviewQuote,
  checkActivityTransaction,
} from '../swaps/shared';
import FixtureBuilder from '../../fixture-builder';
import { unlockWallet, WINDOW_TITLES, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { createDappTransaction } from '../../page-objects/flows/transaction';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import { mockSmartTransactionRequests } from './mocks';

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
        .build(),
      title,
      localNodeOptions: {
        hardfork: 'london',
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

const waitForTransactionToComplete = async (
  driver: Driver,
  options: { tokenName: string },
) => {
  await driver.waitForSelector({
    css: '[data-testid="swap-smart-transaction-status-header"]',
    text: 'Privately submitting your Swap',
  });

  await driver.waitForSelector(
    {
      css: '[data-testid="swap-smart-transaction-status-header"]',
      text: 'Swap complete!',
    },
    { timeout: 30000 },
  );

  await driver.findElement({
    css: '[data-testid="swap-smart-transaction-status-description"]',
    text: `${options.tokenName}`,
  });

  await driver.clickElement({ text: 'Close', tag: 'button' });
  await driver.waitForSelector('[data-testid="account-overview__asset-tab"]');
};

describe('Smart Transactions', function () {
  it('Swap', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockSmartTransactionRequests,
      },
      async ({ driver }) => {
        await buildQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
          mainnet: true,
        });

        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'ETH',
          swapTo: 'DAI',
          skipCounter: true,
        });

        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'ETH',
          swapTo: 'DAI',
        });
      },
    );
  });

  it('dApp Transaction', async function () {
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
        await activityList.check_completedTxNumberDisplayedInActivity();
        await activityList.check_noFailedTransactions();
        await activityList.check_confirmedTxNumberDisplayedInActivity();
      },
    );
  });
});
