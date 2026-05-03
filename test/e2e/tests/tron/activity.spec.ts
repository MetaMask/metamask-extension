import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { TronNode } from '../../seeder/tron/node';
import { createTronPortfolioNodeOptions } from '../../seeder/tron/profiles';
import TronTransactionDetailsPage from '../../page-objects/pages/home/tron-transaction-details';
import {
  TRON_ACCOUNT_ADDRESS,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockTronAssets,
  mockTronFeatureFlags,
  mockTronSpotPrices,
  mockTrxNativeSpotPrices,
  mockTronGetTransactions,
  mockTronGetTrc20Transactions,
} from './mocks/common-tron';
import { proxyTronBlockchainCalls } from './mocks/local-tron-node-mocks';
import {
  trxSendTx,
  trxReceiveTx,
  trc20ApproveTx,
  swapTx,
  bridgeTx,
  freezeV2Tx,
  unfreezeV2Tx,
} from './mocks/tron-tx-fixtures';

type ScenarioMocks = {
  trxTransactions?: unknown[];
  trc20Transactions?: unknown[];
};

function buildActivityMocks({
  trxTransactions,
  trc20Transactions,
}: ScenarioMocks) {
  return async (
    mockServer: Mockttp,
    { localNodes }: { localNodes: unknown[] },
  ) => {
    const tronNode = localNodes.find(
      (node): node is TronNode => node instanceof TronNode,
    );
    if (!tronNode) {
      throw new Error('Tron local node was not started');
    }
    return [
      await mockTronFeatureFlags(mockServer),
      await mockExchangeRates(mockServer),
      await mockFiatExchangeRates(mockServer),
      await mockTronSpotPrices(mockServer, tronNode),
      await mockTrxNativeSpotPrices(mockServer),
      await mockTronAssets(mockServer, tronNode),
      await mockTronGetTransactions(mockServer, trxTransactions),
      await mockTronGetTrc20Transactions(mockServer, trc20Transactions),
      ...(await proxyTronBlockchainCalls(
        mockServer,
        tronNode,
        TRON_ACCOUNT_ADDRESS,
      )),
    ];
  };
}

async function landOnTronActivity(driver: Driver): Promise<ActivityListPage> {
  await login(driver, { validateBalance: false });
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab('Popular');
  await networkManager.selectNetworkByNameWithWait('Tron');
  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
  const activity = new ActivityListPage(driver);
  await activity.openActivityTab();
  return activity;
}

const A_RECIPIENT = 'TBEPnZeEVRJWtJwqY4f3VWEtf9jKyQ4HAu';
const A_SENDER = 'TPwezUWpEGmFBENNWJHwXHRG1D2NCEEt5s';
const A_SPENDER = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

describe('Tron activity', function (this: Suite) {
  this.timeout(180_000);

  it('Approve transaction is rendered with Approve label and amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [],
          trc20Transactions: [
            trc20ApproveTx({
              symbol: 'USDT',
              amount: '10000000',
              spender: A_SPENDER,
              status: 'Confirmed',
            }),
          ],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Approve USDT',
          txIndex: 1,
          confirmedTx: 1,
        });
      },
    );
  });

  it('Send transaction is rendered with Send label and -amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Confirmed',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Send TRX',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('-1 TRX', 1);
      },
    );
  });

  it('Receive transaction is rendered with Receive label and +amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            trxReceiveTx({
              amountSun: 2_500_000,
              from: A_SENDER,
              status: 'Confirmed',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Receive TRX',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('+2.5 TRX', 1);
      },
    );
  });

  it('Swap transaction is rendered with Swap A to B label and -srcAmount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            swapTx({
              srcSymbol: 'TRX',
              srcAmount: '5',
              destSymbol: 'USDT',
              destAmount: '1.42',
              status: 'Confirmed',
            }),
          ],
          trc20Transactions: [],
        }),
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
      },
    );
  });

  it('Bridge transaction is rendered with Bridge label and -srcAmount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            bridgeTx({
              srcSymbol: 'USDT',
              srcAmount: '5',
              destChain: 'eip155:1',
              status: 'Confirmed',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkCompletedBridgeTransactionActivity(1);
        await activity.checkTxAction({
          action: 'Bridge USDT',
          txIndex: 1,
          confirmedTx: 1,
        });
      },
    );
  });

  it('Staking deposit is rendered with Staking deposit label and -amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            freezeV2Tx({ amountSun: 20_000_000, status: 'Confirmed' }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Staking deposit',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('-20 TRX', 1);
      },
    );
  });

  it('Staking withdrawal is rendered with Staking withdrawal label and +amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            unfreezeV2Tx({ amountSun: 20_000_000, status: 'Confirmed' }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.checkTxAction({
          action: 'Staking withdrawal',
          txIndex: 1,
          confirmedTx: 1,
        });
        await activity.checkTxAmountInActivity('+20 TRX', 1);
      },
    );
  });

  it('Pending status: shows pending counter', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Pending',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkPendingTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('Confirmed status: shows confirmed counter', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Confirmed',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('Failed status: shows failed counter', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Failed',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkFailedTxNumberDisplayedInActivity(1);
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): double-blocked. (1) Tron activity propagation regression (no rows render). (2) NetworkFilter is EVM-gated — sort-by-popover-toggle is disabled when chainId is not in FEATURED_NETWORK_CHAIN_IDS, so [data-testid="network-filter-current__button"] is never rendered for Tron (same finding as assets.spec.ts filter tests). Needs product/UX decision before enabling.
  it.skip('Current network filter shows only Tron transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Confirmed',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- TODO(tron-e2e): double-blocked. (1) Tron activity propagation regression (no rows render). (2) NetworkFilter EVM-gating — [data-testid="network-filter-all__button"] is never rendered for Tron (sort-by-popover-toggle disabled for non-FEATURED chain ids). Same finding as assets.spec.ts; needs product/UX decision before enabling.
  it.skip('All networks filter shows other-chain transactions alongside Tron', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [
            trxSendTx({
              amountSun: 1_000_000,
              to: A_RECIPIENT,
              status: 'Confirmed',
            }),
          ],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        const assetList = new AssetListPage(driver);
        await assetList.openNetworksFilter();
        await driver.clickElement('[data-testid="network-filter-all__button"]');
        await driver.waitUntil(
          async () => {
            const items = await driver.findElements(
              '[data-testid="activity-list-item"]',
            );
            return items.length >= 2;
          },
          { timeout: 10_000, interval: 200 },
        );
      },
    );
  });

  it('Transaction details show Title / Time / Status / TXID / From / To / Amount / Network fee / View details', async function () {
    const tx = trxSendTx({
      amountSun: 1_000_000,
      to: A_RECIPIENT,
      status: 'Confirmed',
    });
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: buildActivityMocks({
          trxTransactions: [tx],
          trc20Transactions: [],
        }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activity = await landOnTronActivity(driver);
        await activity.checkConfirmedTxNumberDisplayedInActivity(1);
        await activity.clickOnActivity(1);
        const details = new TronTransactionDetailsPage(driver);
        await details.checkTitle('Send');
        await details.checkTime();
        await details.checkStatus('Confirmed');
        await details.checkAmount('-1 TRX');
        await details.checkAddressInLog(A_RECIPIENT);
        await details.checkAddressInLog(TRON_ACCOUNT_ADDRESS);
        await details.checkHashLink(tx.txID);
        await details.checkNetworkFee('0.0028 TRX');
        await details.checkViewDetailsLink();
      },
    );
  });
});
