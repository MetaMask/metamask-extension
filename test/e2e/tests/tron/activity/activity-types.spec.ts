import { Suite } from 'mocha';
import { selectAllNetworksFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import {
  landOnTronActivity,
  openTronTransactionDetails,
  returnToTronActivityList,
} from '../../../page-objects/flows/tron-activity.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import { TronNode } from '../../../seeder/tron/node';
import { Driver } from '../../../webdriver/driver';
import { buildTronNodeOptions } from '../fixtures/with-tron-fixtures';
import { TRON_ACCOUNT_ADDRESS } from '../mocks/common-tron';
import {
  bridgeTx,
  swapTx,
  trc20ApproveTx,
  trxReceiveTx,
  trxSendTx,
} from '../mocks/tron-tx-fixtures';
import {
  A_RECIPIENT,
  A_SENDER,
  A_SPENDER,
  TRON_ACTIVITY_ACCOUNTS,
  createSharedTronActivitySession,
  mockAccountsApiWithEvmActivity,
} from './helpers';

// Newest-first list order. Approve is first so clickActivityByText on
// "Approved spending cap" opens the real approval, not the bridge fallback.
const ACTIVITY_TIMESTAMP = 1_700_000_000_000;
const APPROVE_TIMESTAMP = ACTIVITY_TIMESTAMP + 4_000;
const SEND_TIMESTAMP = ACTIVITY_TIMESTAMP + 3_000;
const RECEIVE_TIMESTAMP = ACTIVITY_TIMESTAMP + 2_000;
const SWAP_TIMESTAMP = ACTIVITY_TIMESTAMP + 1_000;
const BRIDGE_FALLBACK_TIMESTAMP = ACTIVITY_TIMESTAMP;

const CONFIRMED_TRON_ACTIVITY_COUNT = 5;

describe('Tron - Activity types', function (this: Suite) {
  this.timeout(300_000);

  const sharedTronNode = new TronNode();
  const approve = trc20ApproveTx({
    symbol: 'USDT',
    amount: '10000000',
    spender: A_SPENDER,
    status: 'Confirmed',
    timestamp: APPROVE_TIMESTAMP,
  });
  const send = trxSendTx({
    amountSun: 1_000_000,
    to: A_RECIPIENT,
    status: 'Confirmed',
    timestamp: SEND_TIMESTAMP,
  });
  const receive = trxReceiveTx({
    amountSun: 2_500_000,
    from: A_SENDER,
    status: 'Confirmed',
    timestamp: RECEIVE_TIMESTAMP,
  });
  const swap = swapTx({
    srcSymbol: 'TRX',
    srcAmount: '5',
    destSymbol: 'USDT',
    destAmount: '1420000',
    status: 'Confirmed',
    timestamp: SWAP_TIMESTAMP,
  });
  const bridgeFallback = bridgeTx({
    srcSymbol: 'USDT',
    srcAmount: '5000000',
    destChain: 'eip155:1',
    status: 'Confirmed',
    timestamp: BRIDGE_FALLBACK_TIMESTAMP,
  });
  const chromeSession = createSharedTronActivitySession({
    borrowedTronNode: sharedTronNode,
    testSpecificMock: mockAccountsApiWithEvmActivity,
    transactions: {
      raw: [approve.raw, send, receive, swap.raw, bridgeFallback.raw],
      trc20: [approve.trc20, swap.trc20, bridgeFallback.trc20],
    },
  });

  let driver: Driver;
  let activity: ActivityTab;

   
  before(async function () {
    await sharedTronNode.start(buildTronNodeOptions(TRON_ACTIVITY_ACCOUNTS));
    driver = await chromeSession.start(this.test?.fullTitle());
    activity = await landOnTronActivity(driver);
    await activity.checkConfirmedTxNumberDisplayedInActivity(
      CONFIRMED_TRON_ACTIVITY_COUNT,
    );
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
    

  it('Approve transaction is rendered as a spending cap approval', async function () {
    await activity.checkTransactionActivityByText('Approved spending cap');
    await activity.checkTransactionAmount('-10 USDT');
    const details = await openTronTransactionDetails({
      driver,
      activityTab: activity,
      activityText: 'Approved spending cap',
    });
    await details.checkTitle('Approved spending cap');
    await details.checkStatus('Confirmed');
    await details.checkAmount('-10 USDT');
    await details.checkHashLinkPresent();
    await details.checkViewDetailsLink();
  });

  it('Send transaction uses the outgoing transaction presentation', async function () {
    await activity.checkTransactionActivityByText('Sent TRX');
    await activity.checkTransactionAmount('-1 TRX');
    const details = await openTronTransactionDetails({
      driver,
      activityTab: activity,
      activityText: 'Sent TRX',
    });
    await details.checkTitle('Sent TRX');
    await details.checkTime();
    await details.checkStatus('Confirmed');
    await details.checkAmount('-1 TRX');
    await details.checkHashLinkPresent();
    await details.checkViewDetailsLink();
    await details.checkAddressInLog(A_RECIPIENT);
    await details.checkAddressInLog(TRON_ACCOUNT_ADDRESS);
  });

  it('Receive transaction uses the incoming transaction presentation', async function () {
    await activity.checkTransactionActivityByText('Received TRX');
    await activity.checkTransactionAmount('2.5 TRX');
    const details = await openTronTransactionDetails({
      driver,
      activityTab: activity,
      activityText: 'Received TRX',
    });
    await details.checkTitle('Received TRX');
    await details.checkStatus('Confirmed');
    await details.checkAmount('2.5 TRX');
    await details.checkAddressInLog(A_SENDER);
    await details.checkAddressInLog(TRON_ACCOUNT_ADDRESS);
  });

  it('Swap transaction uses the swap transaction presentation', async function () {
    await activity.checkTransactionActivityByText('Swapped');
    // destAmount is USDT base units (6 decimals): 1420000 → 1.42 USDT.
    // Incoming swap legs are not prefixed with `+`.
    await activity.checkTransactionAmount('1.42 USDT');
    const details = await openTronTransactionDetails({
      driver,
      activityTab: activity,
      activityText: 'Swapped',
    });
    await details.checkTitle('Swapped');
    await details.checkStatus('Confirmed');
    // Details show the outgoing swap leg, not the list dest amount.
    await details.checkAmount('-5 TRX');
  });

  it('Approval event without bridge history falls back to spending cap rendering', async function () {
    // TronGrid-only bridge fixtures are an Approval to the router. A real
    // bridge row needs BridgeStatusController txHistory keyed by the snap tx
    // id, which these activity fixtures do not seed. List-only: details match
    // the spending-cap case above.
    await activity.checkTransactionActivityByText('Approved spending cap');
    await activity.checkTransactionAmount('-5 USDT');
  });

  it('Tron-only filter hides EVM transactions', async function () {
    await activity.checkTransactionActivityByText('Sent TRX');
    await activity.checkTransactionActivityNotPresentByText('Sent ETH');
    await activity.checkConfirmedTxNumberDisplayedInActivity(
      CONFIRMED_TRON_ACTIVITY_COUNT,
    );
    await activity.checkTransactionAmount('-1 TRX');
    await activity.checkTransactionAmountNotPresent('-4.56 ETH');
  });

  it('All networks filter includes transactions from every enabled network', async function () {
    await selectAllNetworksFromNetworkSelect(driver);
    await activity.checkCompletedTxNumberDisplayedInActivity(
      CONFIRMED_TRON_ACTIVITY_COUNT + 1,
    );
    await activity.checkTransactionActivityByText('Sent ETH');
    await activity.checkTransactionAmount('-4.56 ETH');
    await activity.checkTransactionAmount('-1 TRX');
  });
});
