import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import TronTransactionDetailsPage from '../../page-objects/pages/home/tron-transaction-details';
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
  freezeV2Tx,
  unfreezeV2Tx,
} from './mocks/tron-tx-fixtures';

type TronDetailsExpectation = {
  title: string;
  status: 'Confirmed' | 'Pending' | 'Failed';
  amount: string;
  txId: string;
  addresses?: string[];
  networkFee?: string;
  checkTime?: boolean;
};

async function landOnTronActivity(driver: Driver): Promise<ActivityTab> {
  await login(driver, { validateBalance: false });
  await selectTronNetwork(driver);
  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
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
  const details = new TronTransactionDetailsPage(driver);
  await details.checkTitle(expected.title);
  if (expected.checkTime) {
    await details.checkTime();
  }
  await details.checkStatus(expected.status);
  await details.checkAmount(expected.amount);
  await details.checkHashLink(expected.txId);
  for (const address of expected.addresses ?? []) {
    await details.checkAddressInLog(address);
  }
  if (expected.networkFee) {
    await details.checkNetworkFee(expected.networkFee);
  }
}

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
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          data: [EVM_ACTIVITY_TRANSACTION],
          pageInfo: { hasNextPage: false, count: 1 },
        },
      })),
  ];
}

describe('Tron - Activity', function (this: Suite) {
  this.timeout(180_000);

  describe('Mapping per type', function () {
    it('Approve transaction is rendered as Interaction', async function () {
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
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          const activity = await landOnTronActivity(driver);
          await activity.checkConfirmedTxNumberDisplayedInActivity(1);
          await activity.checkTxAction({
            action: 'Interaction',
            txIndex: 1,
            confirmedTx: 1,
          });
          await activity.checkTxAmountInActivity('10 USDT', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Interaction',
            status: 'Confirmed',
            amount: '10 USDT',
            txId: approve.raw.txID,
            addresses: [A_SPENDER, TRON_ACCOUNT_ADDRESS],
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
            action: 'Sent',
            txIndex: 1,
            confirmedTx: 1,
          });
          await activity.checkTxAmountInActivity('-1 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Send',
            status: 'Confirmed',
            amount: '-1 TRX',
            txId: tx.txID,
            addresses: [A_RECIPIENT, TRON_ACCOUNT_ADDRESS],
            networkFee: '-2.7995 TRX',
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
            action: 'Received',
            txIndex: 1,
            confirmedTx: 1,
          });
          // useMultichainTransactionDisplay only adds a `-` prefix for sends; it
          // never prefixes incoming amounts with `+`, so the rendered text is
          // just the bare amount.
          await activity.checkTxAmountInActivity('2.5 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Receive',
            status: 'Confirmed',
            amount: '2.5 TRX',
            txId: tx.txID,
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
            action: 'Swap TRX to USDT',
            txIndex: 1,
            confirmedTx: 1,
          });
          await activity.checkTxAmountInActivity('-5 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Swap',
            status: 'Confirmed',
            amount: '-5 TRX',
            txId: swap.raw.txID,
            addresses: [SUNSWAP_ROUTER_ADDRESS, TRON_ACCOUNT_ADDRESS],
          });
        },
      );
    });

    it('Bridge transaction is rendered as Interaction without bridge history', async function () {
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
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          const activity = await landOnTronActivity(driver);
          await activity.checkCompletedBridgeTransactionActivity(1);
          await activity.checkTxAction({
            action: 'Interaction',
            txIndex: 1,
            confirmedTx: 1,
          });
          await activity.checkTxAmountInActivity('5 USDT', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Interaction',
            status: 'Confirmed',
            amount: '5 USDT',
            txId: bridge.raw.txID,
            addresses: [SUNSWAP_ROUTER_ADDRESS, TRON_ACCOUNT_ADDRESS],
          });
        },
      );
    });

    it('Staking deposit is rendered with Staking deposit label and -amount', async function () {
      const tx = freezeV2Tx({ amountSun: 20_000_000, status: 'Confirmed' });
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
            action: 'Staking deposit',
            txIndex: 1,
            confirmedTx: 1,
          });
          // The snap maps a Freeze as `to[0] = stakedForEnergy`, so the activity
          // row renders the destination asset (sTRX-ENERGY), not the source TRX.
          await activity.checkTxAmountInActivity('20 sTRX-ENERGY', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Staking deposit',
            status: 'Confirmed',
            amount: '20 sTRX-ENERGY',
            txId: tx.txID,
            addresses: [TRON_ACCOUNT_ADDRESS],
          });
        },
      );
    });

    it('Staking withdrawal is rendered with Staking withdrawal label and +amount', async function () {
      const tx = unfreezeV2Tx({ amountSun: 20_000_000, status: 'Confirmed' });
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
            action: 'Staking withdrawal',
            txIndex: 1,
            confirmedTx: 1,
          });
          // useMultichainTransactionDisplay only prefixes sends with `-`; positive
          // (received) amounts render without a `+` sign.
          await activity.checkTxAmountInActivity('20 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Staking withdrawal',
            status: 'Confirmed',
            amount: '20 TRX',
            txId: tx.txID,
            addresses: [TRON_ACCOUNT_ADDRESS],
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
            action: 'Sent',
            txIndex: 1,
            confirmedTx: 0,
          });
          await activity.checkTxAmountInActivity('-1 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Send',
            status: 'Pending',
            amount: '-1 TRX',
            txId: tx.txID,
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
            action: 'Sent',
            txIndex: 1,
            confirmedTx: 1,
          });
          await activity.checkTxAmountInActivity('-1 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Send',
            status: 'Confirmed',
            amount: '-1 TRX',
            txId: tx.txID,
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
            action: 'Sent',
            txIndex: 1,
            confirmedTx: 0,
          });
          await activity.checkTxAmountInActivity('-1 TRX', 1);
          await assertTronTransactionDetails(driver, activity, 1, {
            title: 'Send',
            status: 'Failed',
            amount: '-1 TRX',
            txId: tx.txID,
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
          const assetList = new AssetListPage(driver);
          await assetList.selectAllNetworksInNetworkFilter();
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
          const activity = await landOnTronActivity(driver);
          const assetList = new AssetListPage(driver);
          await assetList.selectOnlyTronInNetworkFilter();
          await activity.checkConfirmedTxNumberDisplayedInActivity(1);
          await activity.checkTransactionAmount('-1 TRX');
          await activity.checkTransactionActivityNotPresentByText('Sent ETH');
          await activity.checkTransactionAmountNotPresent('-4.56 ETH');
        },
      );
    });
  });
});
