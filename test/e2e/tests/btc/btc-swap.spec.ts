import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import {
  mockAllBridgeEndpoints,
  mockBtcSpotPrices,
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

async function buildBtcSwapBaseMocks(mockServer: Mockttp) {
  return [
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    ...(await mockTokensV2SupportedNetworks(mockServer)),
    await mockTokensV3Assets(mockServer),
  ];
}

async function mockBtcSwapMocks(mockServer: Mockttp) {
  const baseMocks = await buildBtcSwapBaseMocks(mockServer);
  return [
    ...baseMocks,
    await mockBtcSpotPrices(mockServer),
    ...(await mockAllBridgeEndpoints(mockServer, { returnQuotes: true })),
  ];
}

async function mockBtcSwapMocksNoQuotes(mockServer: Mockttp) {
  const baseMocks = await buildBtcSwapBaseMocks(mockServer);
  return [
    ...baseMocks,
    await mockBtcSpotPrices(mockServer),
    ...(await mockAllBridgeEndpoints(mockServer, { returnQuotes: false })),
  ];
}

async function mockBtcSwapMocksWithoutNetworkFee(mockServer: Mockttp) {
  const baseMocks = await buildBtcSwapBaseMocks(mockServer);
  return [
    ...baseMocks,
    await mockBtcSpotPrices(mockServer),
    ...(await mockAllBridgeEndpoints(mockServer, {
      networkFeeUnavailable: true,
    })),
  ];
}

describe('BTC Account - Swap (Bridge)', function (this: Suite) {
  it('shows BTC and ETH as the default pair', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();
        await bridgePage.checkAssetsAreSelected('BTC', 'ETH');
      },
    );
  });

  it('updates the quote when the destination changes', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh rehydrates the UI from background state so the
        // asynchronously fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();
        await bridgePage.enterBridgeQuote({
          amount: '0.5',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });
        await bridgePage.waitForQuote();
        await bridgePage.checkExpectedNetworkFeeIsDisplayed();
        await bridgePage.checkAssetsAreSelected('BTC', 'ETH');
        await bridgePage.checkDestAmount('14.72');

        await bridgePage.enterBridgeQuote({
          amount: '0.5',
          tokenTo: 'USDC',
          toChain: 'Ethereum',
        });
        await bridgePage.waitForQuote();
        await bridgePage.checkAssetsAreSelected('BTC', 'USDC');
        await bridgePage.checkDestAmount('40,296');
      },
    );
  });

  it('shows insufficient funds error when amount exceeds balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh rehydrates the UI from background state so the
        // asynchronously fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.clickOnSwapButton();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.enterBridgeQuote({
          amount: '10',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });

        await bridgePage.checkInsufficientFundsButtonIsDisplayed();
      },
    );
  });

  it('disables the swap when the network fee is unavailable', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocksWithoutNetworkFee,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();
        await bridgePage.enterBridgeQuote({
          amount: '0.5',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });
        await bridgePage.waitForQuote();
        await bridgePage.checkExpectedNetworkFeeIsNotDisplayed();
        await bridgePage.checkInsufficientFundsButtonIsDisplayed();
      },
    );
  });

  it('shows no trade route available when no quotes are returned', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocksNoQuotes,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh rehydrates the UI from background state so the
        // asynchronously fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.enterBridgeQuote({
          amount: '0.5',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });

        await bridgePage.checkNoTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('can complete a swap from BTC to ETH', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh rehydrates the UI from background state so the
        // asynchronously fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.clickOnSwapButton();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.enterBridgeQuote({
          amount: '0.1',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });
        await bridgePage.waitForQuote();
        await bridgePage.checkExpectedNetworkFeeIsDisplayed();
        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedBridgeTransactionActivity(2);
        await activityTab.checkTxAction({
          action: 'Bridged BTC',
          confirmedTx: 2,
        });
        await activityTab.checkTxAmountInActivity('+14.7226 ETH');
        await activityTab.checkTxAction({
          action: 'Received BTC',
          confirmedTx: 2,
          txIndex: 2,
        });
      },
    );
  });

  it('can complete a swap from BTC to USDC', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh rehydrates the UI from background state so the
        // asynchronously fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.clickOnSwapButton();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.enterBridgeQuote({
          amount: '0.1',
          tokenTo: 'USDC',
          toChain: 'Ethereum',
        });
        await bridgePage.waitForQuote();
        await bridgePage.checkExpectedNetworkFeeIsDisplayed();
        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedBridgeTransactionActivity(2);
        await activityTab.checkTxAction({
          action: 'Bridged BTC',
          confirmedTx: 2,
        });
        await activityTab.checkTxAmountInActivity('+40,296.22 USDC');
        await activityTab.checkTxAction({
          action: 'Received BTC',
          confirmedTx: 2,
          txIndex: 2,
        });
      },
    );
  });
});
