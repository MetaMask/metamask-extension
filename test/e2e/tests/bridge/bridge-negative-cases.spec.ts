import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import {
  getQuoteNegativeCasesFixtures,
  getTxStatusNegativeCasesFixtures,
} from './bridge-test-utils';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import {
  INTERNAL_SERVER_ERROR,
  EMPTY_RESPONSE,
  GET_QUOTE_INVALID_RESPONSE,
  FAILED_SOURCE_TRANSACTION,
  FAILED_DEST_TRANSACTION,
} from './constants';

describe('Bridge functionality', function (this: Suite) {
  it('should show message that no trade route is available if getQuote returns error 500', async function () {
    await withFixtures(
      getQuoteNegativeCasesFixtures(
        INTERNAL_SERVER_ERROR,
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
      getQuoteNegativeCasesFixtures(EMPTY_RESPONSE, this.test?.fullTitle()),
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
        GET_QUOTE_INVALID_RESPONSE,
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
      getTxStatusNegativeCasesFixtures(
        INTERNAL_SERVER_ERROR,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await disableSmartTransactions(driver);
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        await driver.delay(5000);
        const activityList = new ActivityListPage(driver);
        await activityList.check_pendingBridgeTransactionActivity();
      },
    );
  });

  it('should show failed bridge activity if getTxStatus returns failed source transaction', async function () {
    await withFixtures(
      getTxStatusNegativeCasesFixtures(
        FAILED_SOURCE_TRANSACTION,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await disableSmartTransactions(driver);
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        await driver.delay(5000);
        const activityList = new ActivityListPage(driver);
        // Waiting on a gix on bug #32266
        // await activityList.check_failedTxNumberDisplayedInActivity();
      },
    );
  });

  it('should show failed bridge activity if getTxStatus returns failed destination transaction', async function () {
    await withFixtures(
      getTxStatusNegativeCasesFixtures(
        FAILED_DEST_TRANSACTION,
        this.test?.fullTitle(),
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await disableSmartTransactions(driver);
        await homePage.startBridgeFlow();

        const bridgePage = await enterBridgeQuote(driver);
        await bridgePage.submitQuote();

        await homePage.goToActivityList();
        await driver.delay(5000);
        const activityList = new ActivityListPage(driver);
        // Waiting on a gix on bug #32266
        // await activityList.check_failedTxNumberDisplayedInActivity();
      },
    );
  });
});

async function disableSmartTransactions(driver: Driver) {
  // disable smart transactions
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.check_pageIsLoaded();
  await settingsPage.clickAdvancedTab();
  const advancedSettingsPage = new AdvancedSettings(driver);
  await advancedSettingsPage.check_pageIsLoaded();
  await advancedSettingsPage.toggleSmartTransactions();
  await settingsPage.closeSettingsPage();
}

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
