import { Suite } from 'mocha';

import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
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

const SOLANA_EXPLORER_URL = 'https://solscan.io';

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
        await transactionDetails.checkStatusByTestId('success');
        await transactionDetails.checkAmount(
          commonSolanaTxConfirmedDetailsFixture.amount,
        );
        await transactionDetails.checkFromToLink(
          commonSolanaTxConfirmedDetailsFixture.fromAddress,
        );
        await transactionDetails.checkFromToLink(
          commonSolanaTxConfirmedDetailsFixture.toAddress,
        );
        await transactionDetails.checkHashLink(
          commonSolanaTxConfirmedDetailsFixture.txHash,
          SOLANA_EXPLORER_URL,
        );
        await transactionDetails.checkViewDetailsLink();
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

        await transactionDetails.checkStatusByTestId(
          commonSolanaTxFailedDetailsFixture.status,
        );
        await transactionDetails.checkHashLink(
          commonSolanaTxFailedDetailsFixture.txHash,
          SOLANA_EXPLORER_URL,
        );
        await transactionDetails.checkViewDetailsLink();
        await transactionDetails.checkBaseFee(
          commonSolanaTxFailedDetailsFixture.networkFeeFiat,
        );
      },
    );
  });
});
