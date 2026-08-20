import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { configureFixtureSession } from '../../helpers/fixture-session';
import { Driver } from '../../webdriver/driver';
import {
  createTronSwap,
  landOnTronHome,
  returnToTronHome,
} from '../../page-objects/flows/tron-swap.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { createSwitchableTronSwapMocks } from '../tron/mocks/common-tron';

const { testSpecificMock, setMode } = createSwitchableTronSwapMocks();

// The session suite is created nested so its hooks and tests inherit this
// timeout (Mocha copies the parent suite's timeout when a suite is added).
describe('Swap on Tron', function (this: Suite) {
  this.timeout(180_000);

  // One shared Chrome for all three quote behaviors; the mock mode switches at
  // runtime instead of restarting the browser per test.
  configureFixtureSession(
    'with a shared fixture session',
    {
      fixtures: new FixtureBuilderV2().build(),
      testSpecificMock,
      failFast: true,
      navigateAfterEach: false,
      resetAfterEach: false,
      title: 'Swap on Tron',
    },
    ({ getDriver }) => {
      let driver: Driver;

      before(async function () {
        // The no-fee-estimation case must run before any successful fee
        // estimation: the Tron snap persists fetched chain parameters in its
        // state cache and falls back to the last-known cached value (ignoring
        // expiry) whenever a later fetch fails, so once 'default' mode has
        // estimated fees in this session, estimation can never hard-fail
        // again. Start the session in 'noFeeEstimation' mode so nothing seeds
        // that cache before the first test.
        setMode('noFeeEstimation');
        driver = getDriver();
        await landOnTronHome(driver);
      });

      // Test order is load-bearing: 'noFeeEstimation' must run before
      // 'default' (see the comment in the before hook), and each test after
      // the first backs out of the swap form the previous test left open.

      // Runs first, while the snap's chain-parameters cache is still empty,
      // so the failed fee fetches have no last-known value to fall back on.
      it('Swap disabled when Tron network fees cannot be estimated', async function () {
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await createTronSwap(driver, swapPage, {
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.checkQuoteIsDisplayedWithoutNetworkFee();
        await swapPage.checkInsufficientFundsButtonIsDisplayed();
      });

      // Runs second: switch the mocks to the standard quote and fee payloads,
      // then back out of the swap form the previous test left open. One
      // browser inspects quotes without submitting.
      it('inspects Tron swap quotes without submitting', async function () {
        setMode('default');
        await returnToTronHome(driver, '106.07');
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);

        console.log('Checking Swap form shows default token on open');
        await homePage.clickOnSwapButton();
        await swapPage.checkSourceToken('TRX');

        console.log('Checking quote displayed between TRX and TRC20');
        await createTronSwap(driver, swapPage, {
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
        await createTronSwap(driver, swapPage, {
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
        await createTronSwap(driver, swapPage, {
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
        await createTronSwap(driver, swapPage, {
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
      });

      // Runs last: switch the mocks to an empty quote list and back out of the
      // swap form again before reopening Swap.
      it('No quotes available for the pair', async function () {
        setMode('noQuotes');
        await returnToTronHome(driver, '106.07');
        const homePage = new HomePage(driver);
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await createTronSwap(driver, swapPage, {
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });
        await swapPage.checkNoQuotesAvailable();
      });
    },
  );
});
