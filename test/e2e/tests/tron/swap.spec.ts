import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { startHeldFixtures } from '../../fixtures/held-fixtures';
import type { HeldFixturesSession } from '../../fixtures/held-fixtures';
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
  TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
} from './mocks/common-tron';

describe('Swap on Tron', function (this: Suite) {
  this.timeout(180_000);

  describe('quotes available', function (this: Suite) {
    let driver: Driver;
    let firstFailure: unknown;
    let session: HeldFixturesSession | undefined;

    before(async function () {
      session = await startHeldFixtures({
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.parent?.fullTitle() ?? 'Swap on Tron quotes',
        testSpecificMock: mockTronSwapApis,
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      });
      driver = session.context.driver;
      try {
        await landOnTronHome(driver);
      } catch (error) {
        firstFailure = error;
        throw error;
      }
    });

    beforeEach(function () {
      if (firstFailure) {
        this.skip();
      }
    });

    afterEach(function () {
      if (this.currentTest?.state === 'failed' && !firstFailure) {
        firstFailure = this.currentTest.err;
      }
    });

    after(async function () {
      if (!session) {
        return;
      }
      await session.release(firstFailure);
    });

    it('Quote displayed between TRX and TRC20', async function () {
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.createSwap({
        amount: 1,
        swapTo: 'USDT',
        swapFrom: 'TRX',
        network: 'Tron',
      });
      await swapPage.reviewQuote({
        swapToAmount: '0.295',
        swapFrom: 'TRX',
        swapTo: 'USDT',
        swapFromAmount: '1',
      });
    });

    it('Quote displayed for USDT to TRX swap (reverse direction)', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
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
      assert.notEqual(await swapPage.getFromAmountValue(), '');
      assert.notEqual(await swapPage.getToAmountValue(), '');
    });

    it('Amount exceeding balance shows insufficient funds', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.createSwap({
        amount: 999999,
        swapTo: 'USDT',
        swapFrom: 'TRX',
        network: 'Tron',
      });
      await swapPage.checkInsufficientFundsButtonIsDisplayed();
    });

    it('Quote updates when selecting different destination token', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
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
    });

    it('Swap form shows default token on open', async function () {
      await returnToTronHome(driver);
      const homePage = new HomePage(driver);
      const swapPage = new SwapPage(driver);
      await homePage.clickOnSwapButton();
      await swapPage.checkSourceToken('TRX');
    });
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
