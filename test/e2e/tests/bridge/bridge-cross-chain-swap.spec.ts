import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { getBridgeFixtures } from './bridge-test-utils';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './constants';

describe('Bridge tests', function (this: Suite) {
  it('Execute various bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        {
          'extension-config': {
            ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
            support: true,
          },
        },
        false,
      ),
      async ({ driver }) => {
        await await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
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

        await bridgeTransaction(
          driver,
          {
            amount: '25',
            tokenFrom: 'DAI',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          2,
          '24.9998',
        );

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'DAI',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          3,
          '23.9997',
        );

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          4,
          '22.9997',
        );

        await bridgeTransaction(
          driver,
          {
            amount: '10',
            tokenFrom: 'DAI',
            tokenTo: 'USDT',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          5,
          '22.9996',
        );
      },
    );
  });

  async function bridgeTransaction(
    driver: Driver,
    quote: BridgeQuote,
    transactionsCount: number,
    expectedAmount: string,
  ) {
    // Navigate to Bridge page
    const homePage = new HomePage(driver);
    await homePage.startBridgeFlow();

    const bridgePage = new BridgeQuotePage(driver);
    await bridgePage.enterBridgeQuote(quote);
    await bridgePage.submitQuote();

    await homePage.goToActivityList();

    await driver.delay(5000);
    const activityList = new ActivityListPage(driver);
    await activityList.check_completedBridgeTransactionActivity(
      transactionsCount,
    );

    if (quote.unapproved) {
      await activityList.check_txAction(
        `Approve ${quote.tokenFrom} for bridge`,
      );
      await activityList.check_txAction(`Bridge to ${quote.toChain}`, 2);
    } else {
      await activityList.check_txAction(`Bridge to ${quote.toChain}`);
    }
    // Check the amount of ETH deducted in the activity is correct
    await activityList.check_txAmountInActivity(
      `-${quote.amount} ${quote.tokenFrom}`,
    );

    // Check the wallet ETH balance is correct
    await driver.waitForSelector({
      testId: 'account-value-and-suffix',
      text: expectedAmount,
    });
  }
});
