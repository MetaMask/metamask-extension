import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { Driver } from '../../webdriver/driver';
import { buildBtcUnifiedAssetsFixtures } from './btc-unified-assets-fixture';
import {
  mockAccountsApiV2WithBtc,
  mockAccountsApiV5WithBtc,
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
    mockAccountsApiV2WithBtc(mockServer),
    mockAccountsApiV5WithBtc(mockServer),
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    mockBtcSpotPrices(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    mockTokensV3Assets(mockServer),
  ];
}

async function mockBtcSwapMocks(mockServer: Mockttp) {
  const baseMocks = await buildBtcSwapBaseMocks(mockServer);
  return [
    ...baseMocks,
    ...(await mockAllBridgeEndpoints(mockServer, { returnQuotes: true })),
  ];
}

async function mockBtcSwapMocksNoQuotes(mockServer: Mockttp) {
  const baseMocks = await buildBtcSwapBaseMocks(mockServer);
  return [
    ...baseMocks,
    ...(await mockAllBridgeEndpoints(mockServer, { returnQuotes: false })),
  ];
}

async function switchToBitcoinAndAssertBalance(driver: Driver) {
  const homePage = new HomePage(driver);
  const tokensTab = new TokensTab(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
  await homePage.checkPageIsLoaded();
  await tokensTab.checkNetworkFilterText('Bitcoin');
  await tokensTab.checkExpectedTokenBalanceIsDisplayed(
    `${DEFAULT_BTC_BALANCE}`,
    'BTC',
  );
}

describe('BTC Account - Swap (Bridge)', function (this: Suite) {
  it('can open the swap/bridge page from Bitcoin account', async function () {
    await withFixtures(
      {
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

        await homePage.clickOnSwapButton();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();
      },
    );
  });

  it('can select destination token and see quote', async function () {
    await withFixtures(
      {
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

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
      },
    );
  });

  it('shows insufficient funds error when amount exceeds balance', async function () {
    await withFixtures(
      {
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

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

  it('shows no trade route available when no quotes are returned', async function () {
    await withFixtures(
      {
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocksNoQuotes,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

        await homePage.clickOnSwapButton();

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
        fixtures: buildBtcUnifiedAssetsFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToBitcoinAndAssertBalance(driver);

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
        await activityTab.checkPendingBridgeTransactionActivity(1);

        await activityTab.checkTxAction({
          action: 'Bridge to Ethereum',
          confirmedTx: 1,
        });
      },
    );
  });
});
