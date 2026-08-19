import { Suite } from 'mocha';
import {
  landOnTronActivity,
  openTronTransactionDetails,
} from '../../../page-objects/flows/tron-activity.flow';
import { TronNode } from '../../../seeder/tron/node';
import { trxSendTx } from '../mocks/tron-tx-fixtures';
import { buildTronNodeOptions } from '../fixtures/with-tron-fixtures';
import {
  A_RECIPIENT,
  TRON_ACTIVITY_ACCOUNTS,
  withTronActivityFixtures,
} from './helpers';

describe('Tron - Activity status', function (this: Suite) {
  this.timeout(300_000);

  const sharedTronNode = new TronNode();

  before(async function () {
    await sharedTronNode.start(buildTronNodeOptions(TRON_ACTIVITY_ACCOUNTS));
  });

  after(async function () {
    await sharedTronNode.quit();
  });

  it('Pending status: shows pending counter', async function () {
    const tx = trxSendTx({
      amountSun: 1_000_000,
      to: A_RECIPIENT,
      status: 'Pending',
    });
    await withTronActivityFixtures(
      {
        borrowedTronNode: sharedTronNode,
        title: this.test?.fullTitle(),
        transactions: {
          raw: [tx],
          trc20: [],
        },
      },
      async (driver) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkPendingTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Sending TRX',
          txIndex: 1,
          confirmedTx: 0,
        });
        await activity.checkTxAmountInActivity('-1 TRX', 1);
        const details = await openTronTransactionDetails({
          driver,
          activityTab: activity,
          transactionIndex: 1,
        });
        await details.checkTitle('Sending TRX');
        await details.checkStatus('Pending');
        await details.checkAmount('-1 TRX');
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
      },
    );
  });

  it('Failed status: shows failed counter', async function () {
    const tx = trxSendTx({
      amountSun: 1_000_000,
      to: A_RECIPIENT,
      status: 'Failed',
    });
    await withTronActivityFixtures(
      {
        borrowedTronNode: sharedTronNode,
        title: this.test?.fullTitle(),
        transactions: {
          raw: [tx],
          trc20: [],
        },
      },
      async (driver) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkFailedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Send failed',
          txIndex: 1,
          confirmedTx: 0,
        });
        await activity.checkTxAmountInActivity('-1 TRX', 1);
        const details = await openTronTransactionDetails({
          driver,
          activityTab: activity,
          transactionIndex: 1,
        });
        await details.checkTitle('Send failed');
        await details.checkStatus('Failed');
        await details.checkAmount('-1 TRX');
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
      },
    );
  });
});
