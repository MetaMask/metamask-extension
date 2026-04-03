import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import {
  getGasIncludedSwapFixtures,
  getGasless7702SwapFixtures,
} from './bridge-test-utils';

describe('Gasless swap tests', function (this: Suite) {
  this.timeout(160000);

  it('swaps ETH to USDC with gas included via Max button', async function () {
    await withFixtures(
      getGasIncludedSwapFixtures(this.test?.fullTitle()),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.selectDestToken('USDC');

        await bridgePage.clickMaxButton();

        await bridgePage.waitForQuote();
        await bridgePage.checkGasIncludedIsDisplayed();

        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedBridgeTransactionActivity(1);
        await activityList.checkTxAction({
          action: 'Swap ETH to USDC',
          confirmedTx: 1,
        });
      },
    );
  });

  it('swaps USDC to DAI with gas included using ERC20 source token', async function () {
    await withFixtures(
      getGasIncludedSwapFixtures(this.test?.fullTitle()),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.selectSrcToken('USDC');
        await bridgePage.selectDestToken('DAI');

        await bridgePage.clickMaxButton();

        await bridgePage.waitForQuote();
        await bridgePage.checkGasIncludedIsDisplayed();

        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedBridgeTransactionActivity(2);
        await activityList.checkTxAction({
          action: 'Swap USDC to DAI',
          confirmedTx: 0,
          txIndex: 1,
        });
        await activityList.checkTxAction({
          action: 'Approve USDC for swaps',
          confirmedTx: 0,
          txIndex: 2,
        });
      },
    );
  });

  it('swaps ETH to USDC with gas sponsored via 7702 relay', async function () {
    await withFixtures(
      getGasless7702SwapFixtures(this.test?.fullTitle()),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.selectDestToken('USDC');

        await bridgePage.clickMaxButton();

        await bridgePage.waitForQuote();
        await bridgePage.checkGasSponsoredIsDisplayed();

        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedBridgeTransactionActivity(1);
        await activityList.checkTxAction({
          action: 'Swap ETH to USDC',
          confirmedTx: 1,
        });
      },
    );
  });
});
