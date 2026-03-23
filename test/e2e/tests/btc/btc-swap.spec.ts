import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import { withFixtures } from '../../helpers';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import {
  mockAllBridgeEndpoints,
  mockBitcoinFeatureFlag,
  mockBtcSpotPrices,
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

async function buildBtcSwapBaseMocks(mockServer: Mockttp) {
  return [
    await mockBitcoinFeatureFlag(mockServer),
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
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

const btcSwapManifestFlags = {
  remoteFeatureFlags: {
    bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
    sendRedesign: { enabled: true },
    bitcoinSwaps: { enabled: true },
  },
};

describe('BTC Account - Swap (Bridge)', function (this: Suite) {
  this.timeout(180000); // Bridge tests need longer timeout

  it('can open the swap/bridge page from Bitcoin account', async function () {
    await withFixtures(
      {
        onboarding: true,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        manifestFlags: btcSwapManifestFlags,
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Bitcoin');

        const homePage = new BitcoinHomepage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );

        // Verify swap button is enabled for Bitcoin account
        const isSwapEnabled = await homePage.checkIsSwapButtonEnabled();
        assert.ok(isSwapEnabled, 'Swap button should be enabled for BTC');

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
        onboarding: true,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        manifestFlags: btcSwapManifestFlags,
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Bitcoin');

        const homePage = new BitcoinHomepage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
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
        onboarding: true,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        manifestFlags: btcSwapManifestFlags,
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Bitcoin');

        const homePage = new BitcoinHomepage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
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
        onboarding: true,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        manifestFlags: btcSwapManifestFlags,
        testSpecificMock: mockBtcSwapMocksNoQuotes,
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Bitcoin');

        const homePage = new BitcoinHomepage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
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
        onboarding: true,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        manifestFlags: btcSwapManifestFlags,
        testSpecificMock: mockBtcSwapMocks,
      },
      async ({ driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Bitcoin');

        const homePage = new BitcoinHomepage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
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
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkPendingBridgeTransactionActivity(1);

        // Verify the transaction shows as "Bridge to Ethereum"
        await activityListPage.checkTxAction({
          action: 'Bridge to Ethereum',
          confirmedTx: 1,
        });
      },
    );
  });
});
