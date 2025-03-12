import { Suite } from 'mocha';

import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionDetailsPage from '../../page-objects/pages/home/transaction-details';
import {
  commonSolanaTxConfirmedDetailsFixture,
  withSolanaAccountSnap,
} from './common-solana';

describe('Transaction activity list', function (this: Suite) {
  it('user can see activity list and a confirmed transaction details', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
        isNative: false,
        simulateTransaction: true,
        mockGetTransactionSuccess: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('0');
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(1);
        await activityList.check_txAction('Receive', 1);
        await activityList.check_txAmountInActivity('0.00708 SOL', 1);
        await activityList.check_noFailedTransactions();
        await activityList.clickOnActivity(1);
        const transactionDetails = new TransactionDetailsPage(driver);
        await transactionDetails.check_transactionStatus(
          commonSolanaTxConfirmedDetailsFixture.status,
        );
        await transactionDetails.check_transactionAmount(
          commonSolanaTxConfirmedDetailsFixture.amount,
        );
        await transactionDetails.check_transactionNetworkFee(
          commonSolanaTxConfirmedDetailsFixture.networkFee,
        );
        await transactionDetails.check_transactionFromToLink(
          commonSolanaTxConfirmedDetailsFixture.fromAddress,
        );
        await transactionDetails.check_transactionFromToLink(
          commonSolanaTxConfirmedDetailsFixture.toAddress,
        );
        await transactionDetails.check_transactionHashLink(
          commonSolanaTxConfirmedDetailsFixture.txHash,
        );
        await transactionDetails.check_transactionViewDetailsLink();
      },
    );
  });
});
describe.skip('Transaction activity list', function (this: Suite) {
  // https://consensyssoftware.atlassian.net/browse/SOL-202
  it('user can see activity list and a failed transaction details', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
        isNative: false,
        simulateTransaction: true,
        mockGetTransactionSuccess: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('0');
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(1);
        await activityList.check_txAction('Receive', 1);
        await activityList.check_txAmountInActivity('0.00708 SOL', 1);
        await activityList.check_noFailedTransactions();
        await activityList.clickOnActivity(1);
        const transactionDetails = new TransactionDetailsPage(driver);
        await transactionDetails.check_transactionStatus(
          commonSolanaTxConfirmedDetailsFixture.status,
        );
        await transactionDetails.check_transactionAmount(
          commonSolanaTxConfirmedDetailsFixture.amount,
        );
        await transactionDetails.check_transactionNetworkFee(
          commonSolanaTxConfirmedDetailsFixture.networkFee,
        );
        await transactionDetails.check_transactionFromToLink(
          commonSolanaTxConfirmedDetailsFixture.fromAddress,
        );
        await transactionDetails.check_transactionFromToLink(
          commonSolanaTxConfirmedDetailsFixture.toAddress,
        );
        await transactionDetails.check_transactionHashLink(
          commonSolanaTxConfirmedDetailsFixture.txHash,
        );
        await transactionDetails.check_transactionViewDetailsLink();
      },
    );
  });
});
