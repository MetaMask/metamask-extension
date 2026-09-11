import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  landOnTronActivity,
  openTronTransactionDetails,
} from '../../../page-objects/flows/tron-activity.flow';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import {
  TRON_ACCOUNT_ADDRESS,
  TRON_RECIPIENT_ADDRESS,
} from '../../tron/mocks/common-tron';
import { trxSendTx } from '../../tron/mocks/tron-tx-fixtures';

describe('Tron - Activity status', function (this: Suite) {
  this.timeout(180_000);

  it('shows pending and failed TRX sends with their status in the list and details', async function () {
    // Staggered timestamps keep the activity list ordering deterministic.
    const baseTimestamp = Date.now();
    const pendingSend = trxSendTx({
      amountSun: 1_000_000,
      to: TRON_RECIPIENT_ADDRESS,
      status: 'Pending',
      timestamp: baseTimestamp - 60_000,
    });
    const failedSend = trxSendTx({
      amountSun: 3_000_000,
      to: TRON_RECIPIENT_ADDRESS,
      status: 'Failed',
      timestamp: baseTimestamp - 120_000,
    });

    await withTronFixtures(
      {
        accounts: [
          {
            address: TRON_ACCOUNT_ADDRESS,
            transactions: { raw: [pendingSend, failedSend] },
          },
        ],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const activityTab = await landOnTronActivity(driver);

        await activityTab.checkTransactionActivityByText('Sending TRX');
        await activityTab.checkTransactionAmount('-1 TRX');
        await activityTab.checkTransactionActivityByText('Send failed');
        await activityTab.checkTransactionAmount('-3 TRX');

        const pendingDetails = await openTronTransactionDetails({
          driver,
          activityTab,
          activityText: 'Sending TRX',
        });
        await pendingDetails.checkTitle('Sending TRX');
        await pendingDetails.checkStatus('Pending');
        await pendingDetails.checkAmount('-1 TRX');
        await pendingDetails.checkHashLinkPresent();
        await pendingDetails.checkViewDetailsLink();
        await pendingDetails.clickBackButton();

        const failedDetails = await openTronTransactionDetails({
          driver,
          activityTab,
          activityText: 'Send failed',
        });
        await failedDetails.checkTitle('Send failed');
        await failedDetails.checkStatus('Failed');
        await failedDetails.checkAmount('-3 TRX');
        await failedDetails.checkHashLinkPresent();
        await failedDetails.checkViewDetailsLink();
        await failedDetails.clickBackButtonIfPresent();
      },
    );
  });
});
