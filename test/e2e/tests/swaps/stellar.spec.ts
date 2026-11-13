import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { withStellarFixtures } from '../stellar/fixtures/with-stellar-fixtures';
import { XLM_BALANCE_DISPLAY } from '../stellar/mocks/common-stellar';
import {
  mockBridgeGetStellarQuoteFor,
  mockBridgeGetStellarTokens,
  mockHorizonFeeStatsForSwap,
  mockStellarSwapApis,
  mockStellarSwapApisNoQuotes,
  mockStellarSwapApisWithoutFeeEstimation,
} from '../stellar/mocks/stellar-swap-mocks';
import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';

describe('Swap on Stellar', function (this: Suite) {
  this.timeout(180_000);

  it('Quote displayed between XLM and issued asset', async function () {
    await withStellarFixtures(
      {
        horizonOptions: {
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockStellarSwapApis(mockServer),
        // reviewQuote clicks Swap; snap confirmation / submit may still
        // surface console noise after a successful quote (mirrors Tron).
        ignoredConsoleErrors: ['SnapError', '-32602', '-32603'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'XLM',
          network: 'Stellar',
        });

        // Review quote - mock returns ~0.295 USDC for 1 XLM
        await swapPage.reviewQuote({
          swapToAmount: '0.295',
          swapFrom: 'XLM',
          swapTo: 'USDC',
          swapFromAmount: '1',
        });
      },
    );
  });

  it('Quote displayed when Stellar network fees cannot be estimated', async function () {
    await withStellarFixtures(
      {
        horizonOptions: {
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockStellarSwapApisWithoutFeeEstimation(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'XLM',
          network: 'Stellar',
        });

        // Unlike Tron/BTC, Stellar is not gated by isNetworkFeeUnavailable, so
        // a missing fee estimate still shows the quote (and does not flip CTA
        // to "Insufficient funds").
        await swapPage.checkQuoteIsDisplayedWithoutNetworkFee();
        await swapPage.checkQuoteIsDisplayed();
      },
    );
  });

  it('No quotes available for the pair', async function () {
    await withStellarFixtures(
      {
        horizonOptions: {
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockStellarSwapApisNoQuotes(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'XLM',
          network: 'Stellar',
        });

        await swapPage.checkNoQuotesAvailable();
      },
    );
  });

  it('Quote displayed for USDC to XLM swap (reverse direction)', async function () {
    await withStellarFixtures(
      {
        horizonOptions: {
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer) => [
          ...(await mockBridgeGetStellarTokens(mockServer)),
          await mockBridgeGetStellarQuoteFor(mockServer, {
            src: 'USDC',
            dest: 'XLM',
            srcAmount: '10000000',
            destAmount: '25000000',
          }),
          await mockHorizonFeeStatsForSwap(mockServer),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'XLM',
          swapFrom: 'USDC',
          network: 'Stellar',
        });

        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsDisplayed();
        await swapPage.checkSourceToken('USDC');
        await swapPage.checkDestinationToken('XLM');
        await swapPage.checkSwapAmountsArePopulated();
      },
    );
  });

  it('Amount exceeding balance shows insufficient funds', async function () {
    await withStellarFixtures(
      {
        horizonOptions: {
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockStellarSwapApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 999999,
          swapTo: 'USDC',
          swapFrom: 'XLM',
          network: 'Stellar',
        });

        await swapPage.checkInsufficientFundsButtonIsDisplayed();
      },
    );
  });

  it('Quote updates when selecting different destination token', async function () {
    await withStellarFixtures(
      {
        horizonOptions: {
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockStellarSwapApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 10,
          swapTo: 'USDC',
          swapFrom: 'XLM',
          network: 'Stellar',
        });

        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsDisplayed();

        await swapPage.selectDestinationToken('EURC');
        await swapPage.waitForQuote();
        await swapPage.checkQuoteIsDisplayed();
        await swapPage.checkDestinationToken('EURC');
        await swapPage.checkSourceToken('XLM');
      },
    );
  });

  it('Swap form shows default token on open', async function () {
    await withStellarFixtures(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) => mockStellarSwapApis(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: XLM_BALANCE_DISPLAY,
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.checkSourceToken('XLM');
      },
    );
  });
});
