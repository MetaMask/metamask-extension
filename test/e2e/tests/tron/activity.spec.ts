import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
import { selectTronNetwork } from '../../page-objects/flows/tron-network.flow';
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

type TronDetailsExpectation = {
  title?: string;
  status: 'Confirmed' | 'Pending' | 'Failed';
  amount?: string;
  addresses?: string[];
  networkFee?: string;
  checkTime?: boolean;
};

async function setupTronAccount(driver: Driver): Promise<NonEvmHomepage> {
  await login(driver, { validateBalance: false });
  await selectTronNetwork(driver);
  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
  return home;
}

async function landOnTronActivity(driver: Driver): Promise<ActivityTab> {
  const home = await setupTronAccount(driver);
  const activity = new ActivityTab(driver);
  await activity.goToActivityList();
  return activity;
}

async function assertTronTransactionDetails(
  driver: Driver,
  activity: ActivityTab,
  txIndex: number,
  expected: TronDetailsExpectation,
): Promise<void> {
  await activity.clickOnActivity(txIndex);
  const details = new TransactionDetailsPage(driver);
  await details.checkPageIsLoaded();
  if (expected.title !== undefined) {
    await details.checkTitle(expected.title);
  }
  if (expected.checkTime) {
    await details.checkTime();
  }
  await details.checkStatus(expected.status);
  if (expected.amount !== undefined) {
    await details.checkAmount(expected.amount);
  }
  await details.checkHashLinkPresent();
  await details.checkViewDetailsLink();
  for (const address of expected.addresses ?? []) {
    await details.checkAddressInLog(address);
  }
  if (expected.networkFee) {
    await details.checkBaseFee(expected.networkFee);
  }
}

// Rendering a `token:approve` transaction logs this React error on current
// main because TransactionIcon has no icon mapping for the approve category.
// It is cosmetic and unrelated to the assertions in these tests.
const APPROVE_ICON_CONSOLE_ERRORS = [
  'The category prop passed to TransactionIcon is not supported. The prop is: token:approve',
];

const A_RECIPIENT = 'TBEPnZeEVRJWtJwqY4f3VWEtf9jKyQ4HAu';
const A_SENDER = 'TPwezUWpEGmFBENNWJHwXHRG1D2NCEEt5s';
const A_SPENDER = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const SUNSWAP_ROUTER_ADDRESS = 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax';
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

describe('Tron - Activity', function (this: Suite) {
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
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Approved spending cap',
            status: 'Confirmed',
            amount: '-10 USDT',
          });
        },
      );
    });

    it('Send transaction is rendered with Send label and -amount', async function () {
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
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Sent TRX',
            status: 'Confirmed',
            amount: '-1 TRX',
            addresses: [A_RECIPIENT, TRON_ACCOUNT_ADDRESS],
            checkTime: true,
          });
        },
      );
    });

    it('Receive transaction is rendered with Receive label and +amount', async function () {
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
          // useMultichainTransactionDisplay only adds a `-` prefix for sends; it
          // never prefixes incoming amounts with `+`, so the rendered text is
          // just the bare amount.
          await activity.checkTxAmountInActivity('+2.5 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Received TRX',
            status: 'Confirmed',
            amount: '+2.5 TRX',
            addresses: [A_SENDER, TRON_ACCOUNT_ADDRESS],
          });
        },
      );
    });

    it('Swap transaction is rendered with Swap A to B label and -srcAmount', async function () {
      const swap = swapTx({
        srcSymbol: 'TRX',
        srcAmount: '5',
        destSymbol: 'USDT',
        destAmount: '1.42',
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
          await activity.checkTxAmountInActivity('+<0.00001 USDT', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Swapped',
            status: 'Confirmed',
            amount: '-5 TRX',
          });
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
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Approved spending cap',
            status: 'Confirmed',
            amount: '-5 USDT',
          });
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
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Sending TRX',
            status: 'Pending',
            amount: '-1 TRX',
          });
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
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Sent TRX',
            status: 'Confirmed',
            amount: '-1 TRX',
          });
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
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Send failed',
            status: 'Failed',
            amount: '-1 TRX',
          });
        },
      );
    });
  });

  describe('Network filter', function () {
    it('All networks filter shows EVM and Tron transactions', async function () {
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
          const tokensTab = new TokensTab(driver);
          await tokensTab.selectAllNetworksInNetworkFilter();
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
          const home = await setupTronAccount(driver);
          const tokensTab = new TokensTab(driver);
          await tokensTab.selectOnlyTronInNetworkFilter();
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
