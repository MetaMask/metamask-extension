import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import {
  landOnTronActivity,
  landOnTronHome,
  openTronTransactionDetails,
} from '../../page-objects/flows/tron-activity.flow';
import { selectAllNetworksFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import { TRON_PORTFOLIO_ACCOUNT } from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';
import { TRON_ACCOUNT_ADDRESS } from './mocks/common-tron';
import {
  trxSendTx,
  trxReceiveTx,
  trc20ApproveTx,
  swapTx,
  bridgeTx,
} from './mocks/tron-tx-fixtures';

// Rendering a `token:approve` transaction logs this React error on current
// main because TransactionIcon has no icon mapping for the approve category.
// It is cosmetic and unrelated to the assertions in these tests.
const APPROVE_ICON_CONSOLE_ERRORS = [
  'The category prop passed to TransactionIcon is not supported. The prop is: token:approve',
];

const A_RECIPIENT = 'TBEPnZeEVRJWtJwqY4f3VWEtf9jKyQ4HAu';
const A_SENDER = 'TPwezUWpEGmFBENNWJHwXHRG1D2NCEEt5s';
const A_SPENDER = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
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

// eslint-disable-next-line mocha/no-skipped-tests -- WPN-435: skip until the Tron activity cluster is ready to run in CI
describe.skip('Tron - Activity', function (this: Suite) {
  this.timeout(180_000);

  describe('Mapping per type', function () {
    it('Approve transaction is rendered as a spending cap approval', async function () {
      const approve = trc20ApproveTx({
        symbol: 'USDT',
        amount: '10000000',
        spender: A_SPENDER,
        status: 'Confirmed',
      });
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [approve.raw],
                trc20: [approve.trc20],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          ignoredConsoleErrors: APPROVE_ICON_CONSOLE_ERRORS,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [tx],
                trc20: [],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [tx],
                trc20: [],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [swap.raw],
                trc20: [swap.trc20],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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

    it('Bridge transaction without bridge history falls back to standard rendering', async function () {
      const bridge = bridgeTx({
        srcSymbol: 'USDT',
        srcAmount: '5000000',
        destChain: 'eip155:1',
        status: 'Confirmed',
      });
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [bridge.raw],
                trc20: [bridge.trc20],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          ignoredConsoleErrors: APPROVE_ICON_CONSOLE_ERRORS,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          const activity = await landOnTronActivity(driver);
          await activity.checkCompletedBridgeTransactionActivity(1);
          // The bridge fixture's TRC20 event is an `Approval` to the router,
          // so the snap classifies it as `token:approve` and, without a bridge
          // history entry, the UI must fall back to the standard approval
          // rendering (not the bridge details modal).
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
  });

  describe('Mapping per status', function () {
    it('Pending status: shows pending counter', async function () {
      const tx = trxSendTx({
        amountSun: 1_000_000,
        to: A_RECIPIENT,
        status: 'Pending',
      });
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [tx],
                trc20: [],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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

    it('Confirmed status: shows confirmed counter', async function () {
      const tx = trxSendTx({
        amountSun: 1_000_000,
        to: A_RECIPIENT,
        status: 'Confirmed',
      });
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [tx],
                trc20: [],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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
          await details.checkStatus('Confirmed');
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
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
              transactions: {
                raw: [tx],
                trc20: [],
              },
            },
          ],
          fixtures: new FixtureBuilderV2().build(),
          includeAnvil: false,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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

  describe('Network filter', function () {
    it('All networks filter includes transactions from every enabled network', async function () {
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
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
          ],
          fixtures: new FixtureBuilderV2().build(),
          testSpecificMock: mockAccountsApiWithEvmActivity,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
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
      await withTronFixtures(
        {
          accounts: [
            {
              ...TRON_PORTFOLIO_ACCOUNT,
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
          ],
          fixtures: new FixtureBuilderV2().build(),
          testSpecificMock: mockAccountsApiWithEvmActivity,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          const home = await landOnTronHome(driver);
          await home.goToActivityList();

          const activity = new ActivityTab(driver);
          await activity.checkTransactionActivityByText('Sent TRX');
          await activity.checkTransactionActivityNotPresentByText('Sent ETH');
          await activity.checkConfirmedTxNumberDisplayedInActivity(1);
          await activity.checkTransactionAmount('-1 TRX');
          await activity.checkTransactionAmountNotPresent('-4.56 ETH');
        },
      );
    });
  });
});
