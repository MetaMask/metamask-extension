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

const isUnifiedAssetsEnabled = true;

const BTC_CAIP_ASSET_ID = 'bip122:000000000019d6689c085ae165831e93/slip44:0';

const BTC_SWAP_ASSETS_CONTROLLER_FIXTURE = {
  assetsInfo: {
    [BTC_CAIP_ASSET_ID]: {
      decimals: 8,
      image:
        'https://static.cx.metamask.io/api/v1/tokenIcons/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
      name: 'Bitcoin',
      symbol: 'BTC',
      type: 'native',
    },
  },
};

function buildBtcSwapFixtures() {
  if (!isUnifiedAssetsEnabled) {
    return new FixtureBuilderV2().build();
  }
  return new FixtureBuilderV2()
    .withAssetsController(BTC_SWAP_ASSETS_CONTROLLER_FIXTURE)
    .build();
}

async function buildBtcSwapBaseMocks(mockServer: Mockttp) {
  return [
    ...(isUnifiedAssetsEnabled
      ? [
          mockAccountsApiV2WithBtc(mockServer),
          mockAccountsApiV5WithBtc(mockServer),
        ]
      : []),
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
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

describe('BTC Account - Swap (Bridge)', function (this: Suite) {
  it('can open the swap/bridge page from Bitcoin account', async function () {
    await withFixtures(
      {
        fixtures: buildBtcSwapFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        // Click swap button to open bridge page
        await homePage.clickOnSwapButton();

        // Verify we navigated to the bridge/swap page
        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();
      },
    );
  });

  it('can select destination token and see quote', async function () {
    await withFixtures(
      {
        fixtures: buildBtcSwapFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        // Click swap button
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        // Enter amount for the swap
        await bridgePage.enterBridgeQuote({
          amount: '0.5',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });

        // Wait for quote to be fetched
        await bridgePage.waitForQuote();

        // Verify quote is displayed with network fees
        await bridgePage.checkExpectedNetworkFeeIsDisplayed();
        console.log('Quote received successfully for BTC to ETH swap');
      },
    );
  });

  it('shows insufficient funds error when amount exceeds balance', async function () {
    await withFixtures(
      {
        fixtures: buildBtcSwapFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        // Click swap button
        await homePage.clickOnSwapButton();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        // Enter amount greater than balance (DEFAULT_BTC_BALANCE is 1 BTC)
        await bridgePage.enterBridgeQuote({
          amount: '10',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });

        // Verify insufficient funds button is displayed
        await bridgePage.checkInsufficientFundsButtonIsDisplayed();
        console.log('Insufficient funds error displayed correctly');
      },
    );
  });
  it('shows no trade route available when no quotes are returned', async function () {
    await withFixtures(
      {
        fixtures: buildBtcSwapFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocksNoQuotes,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        // Click swap button
        await homePage.clickOnSwapButton();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        // Enter amount for the swap
        await bridgePage.enterBridgeQuote({
          amount: '0.5',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });

        // Verify no trade route message is displayed
        await bridgePage.checkNoTradeRouteMessageIsDisplayed();
        console.log('No trade route message displayed correctly');
      },
    );
  });

  it('can complete a swap from BTC to ETH', async function () {
    await withFixtures(
      {
        fixtures: buildBtcSwapFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        // Click swap button
        await homePage.clickOnSwapButton();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        // Enter amount for the swap
        await bridgePage.enterBridgeQuote({
          amount: '0.1',
          tokenTo: 'ETH',
          toChain: 'Ethereum',
        });

        // Wait for quote to be fetched
        await bridgePage.waitForQuote();

        // Verify quote is displayed with network fees
        await bridgePage.checkExpectedNetworkFeeIsDisplayed();

        // Submit the swap quote
        await bridgePage.submitQuote();

        // Navigate to activity list and verify the bridge transaction
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPendingBridgeTransactionActivity(1);

        // Verify the transaction shows as "Bridge to Ethereum"
        await activityTab.checkTxAction({
          action: 'Bridge to Ethereum',
          confirmedTx: 1,
        });
      },
    );
  });
});
