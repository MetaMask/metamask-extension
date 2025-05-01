import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { getBridgeFixtures } from './bridge-test-utils';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from './constants';

describe('Bridge tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('Execute multiple bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        {
          ...DEFAULT_BRIDGE_FEATURE_FLAGS.bridgeConfig,
          support: true,
        },
        false,
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24');

        await bridgeTransaction(
          driver,
          {
            amount: '25',
            tokenFrom: 'DAI',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          2,
          '24.9',
        );

        // Switch to Linea Mainnet to set it as the selected network
        // in the network-controller
        await switchToNetworkFlow(driver, 'Linea Mainnet');

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'USDC',
            fromChain: 'Ethereum',
            toChain: 'Arbitrum One',
          },
          3,
          '23.9',
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
          '22.9',
        );

        // Switch to Linea Mainnet to set it as the selected network
        // in the network-controller
        await switchToNetworkFlow(driver, 'Linea Mainnet');

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
          '22.9',
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
