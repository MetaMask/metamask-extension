import { Suite } from 'mocha';
import { TransactionStatus } from '@metamask/keyring-api';
import { Driver } from '../../../webdriver/driver';
import { openActivityTransactionDetails } from '../../../page-objects/flows/activity.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../../page-objects/flows/stellar-network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import { STELLAR_ACCOUNT_ADDRESS } from '../../stellar/mocks/common-stellar';
import {
  STELLAR_RECIPIENT_ADDRESS,
  stellarKeyringSendTx,
} from '../../stellar/mocks/stellar-tx-fixtures';
import { seedStellarMultichainTransactions } from './stellar-activity-helpers';

describe('Stellar - Activity status', function (this: Suite) {
  this.timeout(180_000);

  it('shows pending and failed XLM sends with their status in the list and details', async function () {
    // Horizon only maps successful → Confirmed / Failed. Pending (Unconfirmed)
    // is snap-local, so we seed MultichainTransactionsController after the
    // Stellar account exists (merge-by-id keeps these rows when Horizon is empty).
    const baseTimestamp = Date.now();
    const pendingSend = stellarKeyringSendTx({
      accountId: 'placeholder',
      amount: '1',
      destination: STELLAR_RECIPIENT_ADDRESS,
      status: TransactionStatus.Unconfirmed,
      timestampMs: baseTimestamp - 60_000,
      id: 'stellar-e2e-pending-send',
    });
    const failedSend = stellarKeyringSendTx({
      accountId: 'placeholder',
      amount: '3',
      destination: STELLAR_RECIPIENT_ADDRESS,
      status: TransactionStatus.Failed,
      timestampMs: baseTimestamp - 120_000,
      id: 'stellar-e2e-failed-send',
    });

    await withStellarFixtures(
      {
        accounts: [{ address: STELLAR_ACCOUNT_ADDRESS }],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });
        await selectStellarNetwork(driver);
        await seedStellarMultichainTransactions(driver, [
          pendingSend,
          failedSend,
        ]);

        // Extension reload leaves the vault unlocked; re-select Stellar and open activity.
        await selectStellarNetwork(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPageIsLoaded();

        await activityTab.checkTransactionActivityByText('Sending XLM');
        await activityTab.checkTransactionAmount('-1 XLM');
        await activityTab.checkTransactionActivityByText('Send failed');
        await activityTab.checkTransactionAmount('-3 XLM');

        const pendingDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Sending XLM',
        });
        await pendingDetails.checkTitle('Sending XLM');
        await pendingDetails.checkStatus('Pending');
        await pendingDetails.checkAmount('-1 XLM');
        await pendingDetails.checkHashLinkPresent();
        await pendingDetails.checkViewDetailsLink();
        await pendingDetails.clickBackButton();

        const failedDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Send failed',
        });
        await failedDetails.checkTitle('Send failed');
        await failedDetails.checkStatus('Failed');
        await failedDetails.checkAmount('-3 XLM');
        await failedDetails.checkHashLinkPresent();
        await failedDetails.checkViewDetailsLink();
        await failedDetails.clickBackButtonIfPresent();
      },
    );
  });
});
