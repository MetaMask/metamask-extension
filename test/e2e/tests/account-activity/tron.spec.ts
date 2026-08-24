import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { selectAllNetworksFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  landOnTronActivity,
  openTronTransactionDetails,
} from '../../page-objects/flows/tron-activity.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { TRON_PORTFOLIO_ACCOUNT } from '../tron/fixtures/environments';
import { configureTronFixtureSession } from '../tron/fixtures/tron-fixture-session';
import { TRON_ACCOUNT_ADDRESS } from '../tron/mocks/common-tron';
import {
  bridgeTx,
  swapTx,
  trc20ApproveTx,
  tronBridgeHistoryItem,
  trxReceiveTx,
  trxSendTx,
} from '../tron/mocks/tron-tx-fixtures';

const A_RECIPIENT = 'TBEPnZeEVRJWtJwqY4f3VWEtf9jKyQ4HAu';
const A_SENDER = 'TPwezUWpEGmFBENNWJHwXHRG1D2NCEEt5s';
const A_SPENDER = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const ACTIVITY_TIMESTAMP = 1_700_000_000_000;

const EVM_ACTIVITY_TRANSACTION = {
  hash: '0x1000000000000000000000000000000000000000000000000000000000000001',
  timestamp: new Date(1_234).toISOString(),
  chainId: 1337,
  blockNumber: 1,
  blockHash: '0x2',
  gas: 1,
  gasUsed: 1,
  gasPrice: '1',
  effectiveGasPrice: '1',
  nonce: 1,
  cumulativeGasUsed: 1,
  methodId: null,
  value: '4560000000000000000',
  to: '0x2',
  from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
  isError: false,
  valueTransfers: [
    {
      from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
      to: '0x2',
      amount: '4560000000000000000',
      decimal: 18,
      symbol: 'ETH',
    },
  ],
  logs: [],
  transactionCategory: 'STANDARD',
  transactionType: 'STANDARD',
  readable: 'Send',
};

async function mockAccountsApiWithEvmActivity(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(
        'https://accounts.api.cx.metamask.io/v4/multiaccount/transactions',
      )
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const networksParam = url.searchParams.get('networks') ?? '';
        const evmNetworks = networksParam
          .split(',')
          .filter((network) => network.startsWith('eip155:'));

        return {
          statusCode: 200,
          json: {
            data: evmNetworks.length > 0 ? [EVM_ACTIVITY_TRANSACTION] : [],
            pageInfo: {
              hasNextPage: false,
              count: evmNetworks.length > 0 ? 1 : 0,
            },
          },
        };
      }),
  ];
}

// The outer describe carries the suite timeout: Mocha copies the parent
// timeout into nested suites at creation, covering each shared-session
// `before` that boots the Tron node and Chrome (the CLI default is only 80s).
describe('Tron - Activity', function (this: Suite) {
  this.timeout(120_000);

  describe('Tron - Activity status', function () {
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

    configureTronFixtureSession(
      'with a shared fixture session',
      {
        accounts: [
          {
            ...TRON_PORTFOLIO_ACCOUNT,
            transactions: {
              raw: [pending, failed],
              trc20: [],
            },
          },
        ],
        fixtures: new FixtureBuilderV2().build(),
        includeAnvil: false,
        title: 'Tron - Activity status',
      },
      ({ getDriver }) => {
        let driver: Driver;
        let activity: ActivityTab;

        before(async function () {
          driver = getDriver();
          activity = await landOnTronActivity(driver);
          await activity.checkPendingTxNumberDisplayedInActivity(1);
          await activity.checkFailedTxNumberDisplayedInActivity(1);
        });

        afterEach(async function () {
          if (driver) {
            const details = new TransactionDetailsPage(driver);
            await details.clickBackButtonIfPresent();
          }
        });

        it('renders the pending transaction presentation', async function () {
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

        it('renders the failed transaction presentation', async function () {
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
      },
    );
  });

  describe('Tron - Activity types', function () {
    const APPROVE_TIMESTAMP = ACTIVITY_TIMESTAMP + 4_000;
    const SEND_TIMESTAMP = ACTIVITY_TIMESTAMP + 3_000;
    const RECEIVE_TIMESTAMP = ACTIVITY_TIMESTAMP + 2_000;
    const SWAP_TIMESTAMP = ACTIVITY_TIMESTAMP + 1_000;
    const BRIDGE_TIMESTAMP = ACTIVITY_TIMESTAMP;
    const BRIDGE_SRC_AMOUNT = '5000000';
    const BRIDGE_DEST_AMOUNT = '5000000';

    const CONFIRMED_TRON_ACTIVITY_COUNT = 5;

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
    const bridge = bridgeTx({
      srcSymbol: 'USDT',
      srcAmount: BRIDGE_SRC_AMOUNT,
      destChain: 'eip155:1',
      status: 'Confirmed',
      timestamp: BRIDGE_TIMESTAMP,
    });

    configureTronFixtureSession(
      'with a shared fixture session',
      {
        accounts: [
          {
            ...TRON_PORTFOLIO_ACCOUNT,
            transactions: {
              raw: [approve.raw, send, receive, swap.raw, bridge.raw],
              trc20: [approve.trc20, swap.trc20, bridge.trc20],
            },
          },
        ],
        fixtures: new FixtureBuilderV2()
          .withBridgeStatusController({
            txHistory: {
              [bridge.raw.txID]: tronBridgeHistoryItem({
                destAmount: BRIDGE_DEST_AMOUNT,
                srcAmount: BRIDGE_SRC_AMOUNT,
                timestamp: BRIDGE_TIMESTAMP,
                txId: bridge.raw.txID,
              }),
            },
          })
          .build(),
        includeAnvil: false,
        testSpecificMock: mockAccountsApiWithEvmActivity,
        title: 'Tron - Activity types',
      },
      ({ getDriver }) => {
        let driver: Driver;
        let activity: ActivityTab;

        before(async function () {
          driver = getDriver();
          activity = await landOnTronActivity(driver);
          await activity.checkConfirmedTxNumberDisplayedInActivity(
            CONFIRMED_TRON_ACTIVITY_COUNT,
          );
        });

        afterEach(async function () {
          if (driver) {
            const details = new TransactionDetailsPage(driver);
            await details.clickBackButtonIfPresent();
          }
        });

        // Test order is load-bearing: every test here runs against the Tron
        // network filter that `landOnTronActivity` selects in the `before`
        // hook above. "includes transactions from every enabled network under
        // the all networks filter" switches the filter to All networks and
        // never restores it, so it must stay last.

        it('renders an approve transaction as a spending cap approval', async function () {
          await activity.checkTransactionActivityByText(
            'Approved spending cap',
          );
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

        it('renders a send transaction with the outgoing presentation', async function () {
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

        it('renders a receive transaction with the incoming presentation', async function () {
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

        it('renders a swap transaction with the swap presentation', async function () {
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

        it('renders a bridge transaction with the bridge presentation', async function () {
          await activity.checkTransactionActivityByText('Bridged USDT');
          // destAmount is USDC base units (6 decimals): 5000000 → 5 USDC.
          await activity.checkTransactionAmount('5 USDC');
          const details = await openTronTransactionDetails({
            driver,
            activityTab: activity,
            activityText: 'Bridged USDT',
          });
          await details.checkTitle('Bridged USDT');
          await details.checkStatus('Confirmed');
          await details.checkAmount('-5 USDT');
          await details.checkAmount('+5 USDC');
          await details.checkHashLinkPresent();
        });

        it('hides EVM transactions under the Tron-only filter', async function () {
          await activity.checkTransactionActivityByText('Sent TRX');
          await activity.checkTransactionActivityNotPresentByText('Sent ETH');
          await activity.checkConfirmedTxNumberDisplayedInActivity(
            CONFIRMED_TRON_ACTIVITY_COUNT,
          );
          await activity.checkTransactionAmount('-1 TRX');
          await activity.checkTransactionAmountNotPresent('-4.56 ETH');
        });

        it('includes transactions from every enabled network under the all networks filter', async function () {
          await selectAllNetworksFromNetworkSelect(driver);
          await activity.checkCompletedTxNumberDisplayedInActivity(
            CONFIRMED_TRON_ACTIVITY_COUNT + 1,
          );
          await activity.checkTransactionActivityByText('Sent ETH');
          await activity.checkTransactionAmount('-4.56 ETH');
          await activity.checkTransactionAmount('-1 TRX');
        });
      },
    );
  });
});
