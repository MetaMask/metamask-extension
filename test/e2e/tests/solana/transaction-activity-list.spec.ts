import { Suite } from 'mocha';

import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionDetailsPage from '../../page-objects/pages/home/transaction-details';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  commonSolanaTxConfirmedDetailsFixture,
  commonSolanaTxFailedDetailsFixture,
  buildSolanaTestSpecificMock,
} from './common-solana';

describe('Transaction activity list', function (this: Suite) {
  it('user can see activity list and a confirmed transaction details', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionSuccess: true,
        }),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAction({ action: 'Sent' });
        await activityList.checkTxAmountInActivity('-0.00708 SOL', 1);
        await activityList.checkNoFailedTransactions();
        await activityList.clickOnActivity(1);
        const transactionDetails = new TransactionDetailsPage(driver);
        await transactionDetails.checkTransactionStatus(
          commonSolanaTxConfirmedDetailsFixture.status,
        );
        await transactionDetails.checkTransactionAmount(
          commonSolanaTxConfirmedDetailsFixture.amount,
        );
        await transactionDetails.checkTransactionFromToLink(
          commonSolanaTxConfirmedDetailsFixture.fromAddress,
        );
        await transactionDetails.checkTransactionFromToLink(
          commonSolanaTxConfirmedDetailsFixture.toAddress,
        );
        await transactionDetails.checkTransactionHashLink(
          commonSolanaTxConfirmedDetailsFixture.txHash,
        );
        await transactionDetails.checkTransactionViewDetailsLink();
      },
    );
  });
  it('user can see activity list and a failed transaction details', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionFailed: true,
        }),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkFailedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAction({
          action: 'Interaction',
          confirmedTx: 0,
        });
        await activityList.clickOnActivity(1);
        const transactionDetails = new TransactionDetailsPage(driver);

        await transactionDetails.checkTransactionStatus(
          commonSolanaTxFailedDetailsFixture.status,
        );
        await transactionDetails.checkTransactionHashLink(
          commonSolanaTxFailedDetailsFixture.txHash,
        );
        await transactionDetails.checkTransactionViewDetailsLink();
        await transactionDetails.checkTransactionBaseFee(
          commonSolanaTxFailedDetailsFixture.networkFee,
        );
      },
    );
  });
});
