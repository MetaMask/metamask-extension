import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  landOnTronHome,
  returnToTronHome,
} from '../../page-objects/flows/tron-swap.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import {
  mockTronSwapApis,
  mockTronSwapApisNoQuotes,
  mockTronSwapApisWithoutFeeEstimation,
} from './mocks/common-tron';

describe('Swap on Tron', function (this: Suite) {
  this.timeout(180_000);

  // Same mocks and Swap form. One browser inspects quotes without submitting.
  it('inspects Tron swap quotes without submitting', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);

        console.log('Checking Swap form shows default token on open');
        await homePage.clickOnSwapButton();
        await swapPage.checkSourceToken('TRX');

        console.log('Checking quote displayed between TRX and TRC20');
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsDisplayed();
        await swapPage.checkSourceToken('TRX');
        await swapPage.checkDestinationToken('USDT');
        await swapPage.checkSwapAmounts({
          fromAmount: '1',
          toAmount: '0.295',
        });

        console.log(
          'Checking quote displayed for USDT to TRX swap (reverse direction)',
        );
        await returnToTronHome(driver, '106.07');
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'TRX',
          swapFrom: 'USDT',
          network: 'Tron',
        });
        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsDisplayed();
        await swapPage.checkSourceToken('USDT');
        await swapPage.checkDestinationToken('TRX');
        await swapPage.checkSwapAmountsArePopulated();

        console.log(
          'Checking amount exceeding balance shows insufficient funds',
        );
        await returnToTronHome(driver, '106.07');
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 999999,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.checkInsufficientFundsButtonIsDisplayed();

        console.log(
          'Checking quote updates when selecting a different destination token',
        );
        await returnToTronHome(driver, '106.07');
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 10,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsDisplayed();
        await swapPage.selectDestinationToken('USDC');
        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsDisplayed();
        await swapPage.checkDestinationToken('USDC');
        await swapPage.checkSourceToken('TRX');
      },
    );
  });

  it('Swap disabled when Tron network fees cannot be estimated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisWithoutFeeEstimation,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.checkQuoteIsDisplayedWithoutNetworkFee();
        await swapPage.checkInsufficientFundsButtonIsDisplayed();
      },
    );
  });

  it('No quotes available for the pair', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisNoQuotes,
      },
      async ({ driver }: { driver: Driver }) => {
        await landOnTronHome(driver);
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });
});
