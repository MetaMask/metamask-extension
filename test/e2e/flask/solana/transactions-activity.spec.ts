import { Suite } from 'mocha';

import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { withSolanaAccountSnap } from './common-solana';

describe('Transaction activity list', function (this: Suite) {
  it('user can see activity list', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
        isNative: false,
        simulateTransaction: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(4);
        await activityList.check_txAction('Receive', 4);
        await activityList.check_txAmountInActivity('0.000005 SOL', 4);
        await activityList.check_noFailedTransactions();
        // await activityList.openFirstActivityDetails(); https://consensyssoftware.atlassian.net/browse/SOL-137
      },
    );
  });
});
