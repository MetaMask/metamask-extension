import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import {
  searchAndSelectToken,
  selectDestinationToken,
} from '../../page-objects/flows/bridge.flow';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
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

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();

        await selectDestinationToken(driver, 'USDC');

        await swapPage.clickMaxButton();

        await swapPage.waitForQuote();
        await swapPage.checkGasIncludedIsDisplayed();

        await swapPage.submitQuoteAndDismiss();

        await swapPage.goBackAfterSubmit();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedBridgeTransactionActivity(1);
        await activityTab.checkTxAction({
          action: 'Swapped',
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

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();

        await searchAndSelectToken(driver, 'USDC');
        await selectDestinationToken(driver, 'DAI');

        await swapPage.clickMaxButton();

        await swapPage.waitForQuote();
        await swapPage.checkGasIncludedIsDisplayed();

        await swapPage.submitQuoteAndDismiss();

        await swapPage.goBackAfterSubmit();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedBridgeTransactionActivity(2);
        await activityTab.checkTxAction({
          action: 'Swapped',
          confirmedTx: 0,
          txIndex: 1,
        });
        await activityTab.checkTxAction({
          action: 'Approved spending cap',
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

        const swapPage = new SwapPage(driver);
        await swapPage.checkPageIsLoaded();

        await selectDestinationToken(driver, 'USDC');

        await swapPage.clickMaxButton();

        await swapPage.waitForQuote();
        await swapPage.checkGasSponsoredIsDisplayed();

        await swapPage.submitQuoteAndDismiss();

        await swapPage.goBackAfterSubmit();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedBridgeTransactionActivity(1);
        await activityTab.checkTxAction({
          action: 'Swapped',
          confirmedTx: 1,
        });
      },
    );
  });
});
