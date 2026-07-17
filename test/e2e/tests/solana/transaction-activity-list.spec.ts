import { Suite } from 'mocha';

import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TransactionDetailsPage from '../../page-objects/pages/home/transaction-details';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  commonSolanaTxConfirmedDetailsFixture,
  commonSolanaTxFailedDetailsFixture,
  buildSolanaTestSpecificMock,
} from './common-solana';
import { buildSolanaPositiveBalanceFixture } from './unified-solana-assets';

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
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkTxAction({ action: 'Sent SOL' });
        await activityTab.checkTxAmountInActivity('-0.007079 SOL', 1);
        await activityTab.checkNoFailedTransactions();
        await activityTab.clickOnActivity(1);
        const transactionDetails = new TransactionDetailsPage(driver);
        await transactionDetails.checkTransactionStatus('success');
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
        fixtures: buildSolanaPositiveBalanceFixture(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionFailed: true,
        }),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '50 SOL',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkFailedTxNumberDisplayedInActivity(1);
        await activityTab.checkTxAction({
          action: 'Interaction failed',
          confirmedTx: 0,
        });
        await activityTab.clickOnActivity(1);
        const transactionDetails = new TransactionDetailsPage(driver);

        await transactionDetails.checkTransactionStatus(
          commonSolanaTxFailedDetailsFixture.status,
        );
        await transactionDetails.checkTransactionHashLink(
          commonSolanaTxFailedDetailsFixture.txHash,
        );
        await transactionDetails.checkTransactionViewDetailsLink();
        await transactionDetails.checkTransactionBaseFee(
          commonSolanaTxFailedDetailsFixture.networkFeeFiat,
        );
      },
    );
  });
});
