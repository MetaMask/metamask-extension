import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Swap (Bridge)', function (this: Suite) {
  this.timeout(180000); // Bridge tests need longer timeout

  it('can open the swap/bridge page from Bitcoin account', async function () {
    await withBtcAccountSnap(
      async (driver) => {
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
      this.test?.fullTitle(),
      { mockSwap: true },
    );
  });

  it('can select destination token and see quote', async function () {
    await withBtcAccountSnap(
      async (driver) => {
        const homePage = new BitcoinHomepage(driver);
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
      this.test?.fullTitle(),
      { mockSwap: true },
    );
  });

  it('shows insufficient funds error when amount exceeds balance', async function () {
    await withBtcAccountSnap(
      async (driver) => {
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
      this.test?.fullTitle(),
      { mockSwap: true },
    );
  });
  it('shows no trade route available when no quotes are returned', async function () {
    await withBtcAccountSnap(
      async (driver) => {
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
      this.test?.fullTitle(),
      { mockSwap: true, mockSwapQuotes: false },
    );
  });

  it('can complete a swap from BTC to ETH', async function () {
    await withBtcAccountSnap(
      async (driver) => {
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
      this.test?.fullTitle(),
      { mockSwap: true },
    );
  });
});
