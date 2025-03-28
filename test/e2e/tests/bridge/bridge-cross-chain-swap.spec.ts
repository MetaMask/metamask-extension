import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { getBridgeFixtures } from './bridge-test-utils';
import {
  DEFAULT_FEATURE_FLAGS_RESPONSE,
  EXPECTED_MAINNET_ETH_BALANCE,
} from './constants';

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

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          1,
        );
      },
    );
  });

  async function bridgeTransaction(
    driver: Driver,
    quote: BridgeQuote,
    transactionsCount: number,
  ) {
    // Navigate to Bridge page
    const homePage = new HomePage(driver);
    await homePage.check_expectedBalanceIsDisplayed();
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
      text: `${EXPECTED_MAINNET_ETH_BALANCE}`,
    });

    await driver.delay(5000);
  }
});
