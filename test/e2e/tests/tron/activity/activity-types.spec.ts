import { Suite } from 'mocha';
import {
  landOnTronActivity,
  openTronTransactionDetails,
} from '../../../page-objects/flows/tron-activity.flow';
import { selectAllNetworksFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import { TronNode } from '../../../seeder/tron/node';
import { TRON_ACCOUNT_ADDRESS } from '../mocks/common-tron';
import {
  bridgeTx,
  swapTx,
  trc20ApproveTx,
  trxReceiveTx,
  trxSendTx,
} from '../mocks/tron-tx-fixtures';
import { buildTronNodeOptions } from '../fixtures/with-tron-fixtures';
import {
  A_RECIPIENT,
  A_SENDER,
  A_SPENDER,
  TRON_ACTIVITY_ACCOUNTS,
  mockAccountsApiWithEvmActivity,
  withTronActivityFixtures,
} from './helpers';

describe('Tron - Activity types', function (this: Suite) {
  this.timeout(300_000);

  const sharedTronNode = new TronNode();

  before(async function () {
    await sharedTronNode.start(buildTronNodeOptions(TRON_ACTIVITY_ACCOUNTS));
  });

  after(async function () {
    await sharedTronNode.quit();
  });

  it('Approve transaction is rendered as a spending cap approval', async function () {
    const approve = trc20ApproveTx({
      symbol: 'USDT',
      amount: '10000000',
      spender: A_SPENDER,
      status: 'Confirmed',
    });
    await withTronActivityFixtures(
      {
        borrowedTronNode: sharedTronNode,
        title: this.test?.fullTitle(),
        transactions: {
          raw: [approve.raw],
          trc20: [approve.trc20],
        },
      },
      async (driver) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          // Activity list title uses activity_approveSpendingCap_success_title
          // ("Approved spending cap"); symbol appears in the row subtitle.
          action: 'Approved spending cap',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('-10 USDT', 1);
        const details = await openTronTransactionDetails({
          driver,
          activityTab: activity,
          transactionIndex: 1,
        });
        await details.checkTitle('Approved spending cap');
        await details.checkStatus('Confirmed');
        await details.checkAmount('-10 USDT');
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
      },
    );
  });

  it('Send transaction uses the outgoing transaction presentation', async function () {
    const tx = trxSendTx({
      amountSun: 1_000_000,
      to: A_RECIPIENT,
      status: 'Confirmed',
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
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Sent TRX',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('-1 TRX', 1);
        const details = await openTronTransactionDetails({
          driver,
          activityTab: activity,
          transactionIndex: 1,
        });
        await details.checkTitle('Sent TRX');
        await details.checkTime();
        await details.checkStatus('Confirmed');
        await details.checkAmount('-1 TRX');
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
        await details.checkAddressInLog(A_RECIPIENT);
        await details.checkAddressInLog(TRON_ACCOUNT_ADDRESS);
      },
    );
  });

  it('Receive transaction uses the incoming transaction presentation', async function () {
    const tx = trxReceiveTx({
      amountSun: 2_500_000,
      from: A_SENDER,
      status: 'Confirmed',
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
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Received TRX',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('2.5 TRX', 1);
        const details = await openTronTransactionDetails({
          driver,
          activityTab: activity,
          transactionIndex: 1,
        });
        await details.checkTitle('Received TRX');
        await details.checkStatus('Confirmed');
        await details.checkAmount('2.5 TRX');
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
        await details.checkAddressInLog(A_SENDER);
        await details.checkAddressInLog(TRON_ACCOUNT_ADDRESS);
      },
    );
  });

  it('Swap transaction uses the swap transaction presentation', async function () {
    const swap = swapTx({
      srcSymbol: 'TRX',
      srcAmount: '5',
      destSymbol: 'USDT',
      destAmount: '1420000',
      status: 'Confirmed',
    });
    await withTronActivityFixtures(
      {
        borrowedTronNode: sharedTronNode,
        title: this.test?.fullTitle(),
        transactions: {
          raw: [swap.raw],
          trc20: [swap.trc20],
        },
      },
      async (driver) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Swapped',
          txIndex: 1,
          confirmedTx: 1,
        });
        // destAmount is USDT base units (6 decimals): 1420000 → 1.42 USDT.
        // Incoming swap legs are not prefixed with `+`.
        await activity.checkTxAmountInActivity('1.42 USDT', 1);
        const details = await openTronTransactionDetails({
          driver,
          activityTab: activity,
          transactionIndex: 1,
        });
        await details.checkTitle('Swapped');
        await details.checkStatus('Confirmed');
        await details.checkAmount('-5 TRX');
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
      },
    );
  });

  it('Approval event without bridge history falls back to spending cap rendering', async function () {
    const bridge = bridgeTx({
      srcSymbol: 'USDT',
      srcAmount: '5000000',
      destChain: 'eip155:1',
      status: 'Confirmed',
    });
    await withTronActivityFixtures(
      {
        borrowedTronNode: sharedTronNode,
        title: this.test?.fullTitle(),
        transactions: {
          raw: [bridge.raw],
          trc20: [bridge.trc20],
        },
      },
      async (driver) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        // The bridge fixture's TRC20 event is an `Approval` to the router,
        // so the snap classifies it as `token:approve` and, without a bridge
        // history entry, the UI falls back to standard approval rendering.
        await activity.checkTxAction({
          action: 'Approved spending cap',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('-5 USDT', 1);
        const details = await openTronTransactionDetails({
          driver,
          activityTab: activity,
          transactionIndex: 1,
        });
        await details.checkTitle('Approved spending cap');
        await details.checkStatus('Confirmed');
        await details.checkAmount('-5 USDT');
        await details.checkHashLinkPresent();
        await details.checkViewDetailsLink();
      },
    );
  });

  it('All networks filter includes transactions from every enabled network', async function () {
    await withTronActivityFixtures(
      {
        borrowedTronNode: sharedTronNode,
        testSpecificMock: mockAccountsApiWithEvmActivity,
        title: this.test?.fullTitle(),
        transactions: {
          raw: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Confirmed',
            }),
          ],
          trc20: [],
        },
      },
      async (driver) => {
        const activity = await landOnTronActivity(driver);
        await selectAllNetworksFromNetworkSelect(driver);
        await activity.checkCompletedTxNumberDisplayedInActivity(2);
        await activity.checkTransactionActivityByText('Sent ETH');
        await activity.checkTransactionAmount('-4.56 ETH');
        await activity.checkTransactionAmount('-1 TRX');
      },
    );
  });

  it('Tron-only filter hides EVM transactions', async function () {
    await withTronActivityFixtures(
      {
        borrowedTronNode: sharedTronNode,
        testSpecificMock: mockAccountsApiWithEvmActivity,
        title: this.test?.fullTitle(),
        transactions: {
          raw: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Confirmed',
            }),
          ],
          trc20: [],
        },
      },
      async (driver) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkTransactionActivityByText('Sent TRX');
        await activity.checkTransactionActivityNotPresentByText('Sent ETH');
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTransactionAmount('-1 TRX');
        await activity.checkTransactionAmountNotPresent('-4.56 ETH');
      },
    );
  });
});
