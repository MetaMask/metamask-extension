import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import {
  getBridgeNegativeCasesFixtures,
  getInsufficientFundsFixtures,
  getQuoteNegativeCasesFixtures,
} from './bridge-test-utils';
import {
  GET_QUOTE_INVALID_RESPONSE,
  FAILED_SOURCE_TRANSACTION,
  FAILED_DEST_TRANSACTION,
  DEFAULT_BRIDGE_FEATURE_FLAGS,
} from './constants';

describe('Bridge functionality', function (this: Suite) {
  it('should show that more funds are needed to execute the Bridge', async function () {
    await withFixtures(
      getInsufficientFundsFixtures(
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24');
        await homePage.startBridgeFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '24.9950',
          tokenFrom: 'ETH',
          tokenTo: 'WETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgePage.check_insufficientFundsButtonIsDisplayed();
        await bridgePage.check_moreETHneededIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns error 500', async function () {
    await withFixtures(
      getQuoteNegativeCasesFixtures(
        {
          statusCode: 500,
          json: 'Internal server error',
        },
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.check_noTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns empty array', async function () {
    await withFixtures(
      getQuoteNegativeCasesFixtures(
        {
          statusCode: 200,
          json: [],
        },
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.check_noTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns invalid response', async function () {
    await withFixtures(
      getQuoteNegativeCasesFixtures(
        {
          statusCode: 200,
          json: GET_QUOTE_INVALID_RESPONSE,
        },
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.check_noTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show that bridge transaction is pending if getTxStatus returns error 500', async function () {
    await withFixtures(
      getBridgeNegativeCasesFixtures(
        {
          statusCode: 500,
          json: 'Internal server error',
        },
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24');
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.check_pendingBridgeTransactionActivity();
      },
    );
  });

  it('should show failed bridge activity if getTxStatus returns failed source transaction', async function () {
    await withFixtures(
      getBridgeNegativeCasesFixtures(
        {
          statusCode: 200,
          json: FAILED_SOURCE_TRANSACTION,
        },
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24');
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuote();

        await homePage.goToActivityList();

        // Until bug #32266 is fixed
        // const activityList = new ActivityListPage(driver);
        // await activityList.check_failedTxNumberDisplayedInActivity();
      },
    );
  });

  it('should show failed bridge activity if getTxStatus returns failed destination transaction', async function () {
    await withFixtures(
      getBridgeNegativeCasesFixtures(
        {
          statusCode: 200,
          json: FAILED_DEST_TRANSACTION,
        },
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24');
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuote();

        await homePage.goToActivityList();

        // Until bug #32266 is fixed
        // const activityList = new ActivityListPage(driver);
        // await activityList.check_failedTxNumberDisplayedInActivity();
      },
    );
  });
});

async function enterBridgeQuote(driver: Driver): Promise<BridgeQuotePage> {
  const bridgePage = new BridgeQuotePage(driver);
  await bridgePage.enterBridgeQuote({
    amount: '1',
    tokenFrom: 'ETH',
    tokenTo: 'ETH',
    fromChain: 'Ethereum',
    toChain: 'Linea',
  });

  return bridgePage;
}
