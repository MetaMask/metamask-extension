import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  switchToNetworkFlow,
  searchAndSwitchToNetworkFlow,
} from '../../page-objects/flows/network.flow';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { getBridgeL2Fixtures } from './bridge-test-utils';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './constants';

describe('Bridge tests', function (this: Suite) {
  it('should execete bridge transactions on L2 networks', async function () {
    await withFixtures(
      getBridgeL2Fixtures(this.test?.fullTitle(), {
        'extension-config': {
          ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
          support: true,
        },
      }),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();

        // Add Arbitrum One and make it the current network
        await searchAndSwitchToNetworkFlow(driver, 'Arbitrum One');

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Linea',
            toChain: 'Ethereum',
          },
          1,
          '23.9999',
        );

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Linea',
            toChain: 'Arbitrum One',
          },
          2,
          '22.9999',
        );

        // Switch to Ethereum to set it as the current network
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');

        await bridgeTransaction(
          driver,
          {
            amount: '10',
            tokenFrom: 'DAI',
            tokenTo: 'DAI',
            fromChain: 'Linea',
            toChain: 'Arbitrum One',
          },
          4,
          '22.9998',
        );

        // Switch to Arbitrum One to set it as the current network
        await switchToNetworkFlow(driver, 'Arbitrum One');

        await bridgeTransaction(
          driver,
          {
            amount: '10',
            tokenFrom: 'DAI',
            tokenTo: 'DAI',
            fromChain: 'Linea',
            toChain: 'Ethereum',
          },
          6,
          '22.9997',
        );

        await driver.delay(10000);
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
    await driver.delay(1500);
    await bridgePage.submitQuote();

    await homePage.goToActivityList();

    await driver.delay(5000);
    const activityList = new ActivityListPage(driver);
    await activityList.check_completedBridgeTransactionActivity(
      transactionsCount,
    );

    if (quote.unapproved) {
      await activityList.check_txAction(`Bridge to ${quote.toChain}`);
      await activityList.check_txAction(
        `Approve ${quote.tokenFrom} for bridge`,
        2,
      );
    } else {
      await activityList.check_txAction(`Bridge to ${quote.toChain}`);
    }
    // Check the amount of ETH deducted in the activity is correct
    await activityList.check_txAmountInActivity(
      `-${quote.amount} ${quote.tokenFrom}`,
    );

    // Check the wallet ETH balance is correct
    const accountListPage = new AccountListPage(driver);
    await accountListPage.check_accountValueAndSuffixDisplayed(expectedAmount);
  }
});
