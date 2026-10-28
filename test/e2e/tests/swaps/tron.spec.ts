import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { TRON_CHECK_BALANCE_ACCOUNT } from '../tron/fixtures/environments';
import { withTronFixtures } from '../tron/fixtures/with-tron-fixtures';
import {
  mockTronSwapApis,
  mockTronSwapApisNoQuotes,
  mockTronSwapApisWithoutFeeEstimation,
  TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
} from '../tron/mocks/common-tron';

describe('Swap on Tron', function (this: Suite) {
  this.timeout(180_000);

  it('Quote displayed between TRX and TRC20', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockTronSwapApis(mockServer),
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        // Review quote - mock returns ~0.295 USDT for 1 TRX
        await swapPage.reviewQuote({
          swapToAmount: '0.295',
          swapFrom: 'TRX',
          swapTo: 'USDT',
          swapFromAmount: '1',
        });
      },
    );
  });

  it('Swap disabled when Tron network fees cannot be estimated', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockTronSwapApisWithoutFeeEstimation(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
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
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockTronSwapApisNoQuotes(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        // Verify no quotes available message
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });

  it('Quote displayed for USDT to TRX swap (reverse direction)', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockTronSwapApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
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
        await swapPage.checkSwapAmountsArePopulated();
      },
    );
  });

  it('Amount exceeding balance shows insufficient funds', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockTronSwapApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 999999,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        await swapPage.checkInsufficientFundsButtonIsDisplayed();
      },
    );
  });

  it('Quote updates when selecting different destination token', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockTronSwapApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
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
      },
    );
  });

  it('Swap form shows default token on open', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockTronSwapApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('106.072');
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.checkSourceToken('TRX');
      },
    );
  });
});
