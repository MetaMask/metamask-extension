import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

describe.skip('Transaction activity list', function (this: Suite) {
  // skipped due tohttps://github.com/MetaMask/snaps/issues/3019
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
        await driver.delay(1000000);
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(2);
        await activityList.check_txAction('Receive', 1);
        await activityList.check_txAmountInActivity('-0.000005', 2);
        await activityList.check_noFailedTransactions();
      },
    );
  });
});
