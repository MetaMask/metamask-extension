import { Suite } from 'mocha';
import {
  landOnTronActivity,
  openTronTransactionDetails,
  returnToTronActivityList,
} from '../../../page-objects/flows/tron-activity.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import { TronNode } from '../../../seeder/tron/node';
import { Driver } from '../../../webdriver/driver';
import { buildTronNodeOptions } from '../fixtures/with-tron-fixtures';
import { trxSendTx } from '../mocks/tron-tx-fixtures';
import {
  A_RECIPIENT,
  TRON_ACTIVITY_ACCOUNTS,
  createSharedTronActivitySession,
} from './helpers';

const ACTIVITY_TIMESTAMP = 1_700_000_000_000;

describe('Tron - Activity status', function (this: Suite) {
  this.timeout(300_000);

  const sharedTronNode = new TronNode();
  const pending = trxSendTx({
    amountSun: 1_000_000,
    to: A_RECIPIENT,
    status: 'Pending',
    timestamp: ACTIVITY_TIMESTAMP + 1_000,
  });
  const failed = trxSendTx({
    amountSun: 3_000_000,
    to: A_RECIPIENT,
    status: 'Failed',
    timestamp: ACTIVITY_TIMESTAMP,
  });
  const chromeSession = createSharedTronActivitySession({
    borrowedTronNode: sharedTronNode,
    transactions: {
      raw: [pending, failed],
      trc20: [],
    },
  });

  let driver: Driver;
  let activity: ActivityTab;

   
  before(async function () {
    await sharedTronNode.start(buildTronNodeOptions(TRON_ACTIVITY_ACCOUNTS));
    driver = await chromeSession.start(this.test?.fullTitle());
    activity = await landOnTronActivity(driver);
    await activity.checkPendingTxNumberDisplayedInActivity(1);
    await activity.checkFailedTxNumberDisplayedInActivity(1);
  });

  after(async function () {
    try {
      await chromeSession.stop();
    } finally {
      await sharedTronNode.quit();
    }
  });

  afterEach(async function () {
    if (driver) {
      await returnToTronActivityList(driver);
    }
  });
    

  it('Pending status: shows pending counter', async function () {
    await activity.checkTransactionActivityByText('Sending TRX');
    await activity.checkTransactionAmount('-1 TRX');
    const details = await openTronTransactionDetails({
      driver,
      activityTab: activity,
      activityText: 'Sending TRX',
    });
    await details.checkTitle('Sending TRX');
    await details.checkStatus('Pending');
    await details.checkAmount('-1 TRX');
    await details.checkHashLinkPresent();
    await details.checkViewDetailsLink();
  });

  it('Failed status: shows failed counter', async function () {
    await activity.checkTransactionActivityByText('Send failed');
    await activity.checkTransactionAmount('-3 TRX');
    const details = await openTronTransactionDetails({
      driver,
      activityTab: activity,
      activityText: 'Send failed',
    });
    await details.checkTitle('Send failed');
    await details.checkStatus('Failed');
    await details.checkAmount('-3 TRX');
    await details.checkHashLinkPresent();
    await details.checkViewDetailsLink();
  });
});
