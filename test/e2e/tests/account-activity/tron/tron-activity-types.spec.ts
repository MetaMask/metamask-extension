import { Suite } from 'mocha';
import type { MockedEndpoint, Mockttp } from 'mockttp';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  landOnTronActivity,
  openTronTransactionDetails,
} from '../../../page-objects/flows/tron-activity.flow';
import { selectAllNetworksFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import { selectTronNetwork } from '../../../page-objects/flows/tron-network.flow';
import {
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  ACCOUNT_2,
} from '../../../constants';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import {
  TRON_ACCOUNT_ADDRESS,
  TRON_RECIPIENT_ADDRESS,
} from '../../tron/mocks/common-tron';
import {
  bridgeTx,
  swapTx,
  trc20ApproveTx,
  tronBridgeHistoryItem,
  trxReceiveTx,
  trxSendTx,
} from '../../tron/mocks/tron-tx-fixtures';

const BASE_TIMESTAMP = Date.now();

/** A confirmed native ETH send returned by the accounts activity API. */
const EVM_SEND_TX = {
  hash: `0x${'cd'.repeat(32)}`,
  timestamp: new Date(BASE_TIMESTAMP - 300_000).toISOString(),
  chainId: 1337,
  blockNumber: 100,
  blockHash: `0x${'ef'.repeat(32)}`,
  gas: 21_000,
  gasUsed: 21_000,
  gasPrice: '1000000000',
  effectiveGasPrice: '1000000000',
  nonce: 0,
  cumulativeGasUsed: 21_000,
  value: '1000000000000000000',
  from: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  to: ACCOUNT_2.toLowerCase(),
  isError: false,
  transactionCategory: 'TRANSFER',
  valueTransfers: [
    {
      from: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
      to: ACCOUNT_2.toLowerCase(),
      amount: '1000000000000000000',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ether',
      transferType: 'normal',
    },
  ],
};

/**
 * Serves an EVM send from the accounts activity API only when the request
 * covers EVM networks. Under the Tron-only filter the UI never queries EVM
 * networks, so the mocked transaction stays hidden.
 *
 * @param mockServer - The Mockttp server instance.
 */
async function mockEvmActivityApi(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forGet(
        /https:\/\/accounts\.api\.cx\.metamask\.io\/v4\/multiaccount\/transactions/u,
      )
      .always()
      .thenCallback((request) => {
        const networks = new URL(request.url).searchParams
          .getAll('networks')
          .flatMap((value) => value.split(','));
        const data = networks.some((network) => network.startsWith('eip155:'))
          ? [EVM_SEND_TX]
          : [];
        return {
          statusCode: 200,
          json: {
            unprocessedNetworks: [],
            pageInfo: { count: data.length, hasNextPage: false },
            data,
          },
        };
      }),
  ];
}

describe('Tron - Activity types', function (this: Suite) {
  this.timeout(180_000);

  it('renders approved cap, sent, received, swapped and bridged transactions', async function () {
    // Staggered timestamps keep the activity list ordering deterministic.
    const approveTx = trc20ApproveTx({
      symbol: 'USDT',
      amount: '10000000',
      spender: TRON_RECIPIENT_ADDRESS,
      status: 'Confirmed',
      timestamp: BASE_TIMESTAMP - 60_000,
    });
    const sendTx = trxSendTx({
      amountSun: 1_000_000,
      to: TRON_RECIPIENT_ADDRESS,
      status: 'Confirmed',
      timestamp: BASE_TIMESTAMP - 120_000,
    });
    const receiveTx = trxReceiveTx({
      amountSun: 2_500_000,
      from: TRON_RECIPIENT_ADDRESS,
      status: 'Confirmed',
      timestamp: BASE_TIMESTAMP - 180_000,
    });
    const swap = swapTx({
      srcSymbol: 'TRX',
      srcAmount: '1',
      destSymbol: 'USDT',
      destAmount: '2500000',
      status: 'Confirmed',
      timestamp: BASE_TIMESTAMP - 240_000,
    });
    const bridge = bridgeTx({
      srcSymbol: 'USDT',
      srcAmount: '1500000',
      destChain: 'eip155:1',
      status: 'Confirmed',
      timestamp: BASE_TIMESTAMP - 300_000,
    });
    const bridgeHistory = tronBridgeHistoryItem({
      txId: bridge.raw.txID,
      srcAmount: '1.5',
      destAmount: '1.49',
      timestamp: BASE_TIMESTAMP - 300_000,
    });

    await withTronFixtures(
      {
        accounts: [
          {
            address: TRON_ACCOUNT_ADDRESS,
            transactions: {
              raw: [sendTx, receiveTx, swap.raw, approveTx.raw, bridge.raw],
              trc20: [approveTx.trc20, swap.trc20, bridge.trc20],
            },
          },
        ],
        fixtures: new FixtureBuilderV2()
          .withBridgeStatusController({
            txHistory: { [bridge.raw.txID]: bridgeHistory },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const activityTab = await landOnTronActivity(driver);

        // Approved spending cap
        await activityTab.checkTransactionActivityByText(
          'Approved spending cap',
        );
        await activityTab.checkTransactionAmount('-10 USDT');
        const approveDetails = await openTronTransactionDetails({
          driver,
          activityTab,
          activityText: 'Approved spending cap',
        });
        await approveDetails.checkTitle('Approved spending cap');
        await approveDetails.clickBackButton();

        // Sent
        await activityTab.checkTransactionActivityByText('Sent TRX');
        await activityTab.checkTransactionAmount('-1 TRX');
        const sendDetails = await openTronTransactionDetails({
          driver,
          activityTab,
          activityText: 'Sent TRX',
        });
        await sendDetails.checkTitle('Sent TRX');
        await sendDetails.checkAmount('-1 TRX');
        await sendDetails.checkAddressInLog(TRON_RECIPIENT_ADDRESS);
        await sendDetails.checkAddressInLog(TRON_ACCOUNT_ADDRESS);
        await sendDetails.clickBackButton();

        // Received
        await activityTab.checkTransactionActivityByText('Received TRX');
        await activityTab.checkTransactionAmount('+2.5 TRX');

        // Swapped
        await activityTab.checkTransactionActivityByText('Swapped');
        await activityTab.checkTransactionAmount('+2.5 USDT');
        const swapDetails = await openTronTransactionDetails({
          driver,
          activityTab,
          activityText: 'Swapped',
        });
        await swapDetails.checkTitle('Swapped');
        await swapDetails.checkAmount('-1 TRX');
        await swapDetails.checkAmount('+2.5 USDT');
        await swapDetails.clickBackButton();

        // Bridged (reclassified from the seeded BridgeStatusController history)
        await activityTab.checkTransactionActivityByText('Bridged USDT');
        await activityTab.checkTransactionAmount('+1.49 USDC');
        const bridgeDetails = await openTronTransactionDetails({
          driver,
          activityTab,
          activityText: 'Bridged USDT',
        });
        await bridgeDetails.checkTitle('Bridged USDT');
        await bridgeDetails.checkAmount('-1.5 USDT');
        await bridgeDetails.checkAmount('+1.49 USDC');
        await bridgeDetails.clickBackButtonIfPresent();
      },
    );
  });

  it('hides EVM activity under the Tron-only filter and shows it under all networks', async function () {
    const sendTx = trxSendTx({
      amountSun: 1_000_000,
      to: TRON_RECIPIENT_ADDRESS,
      status: 'Confirmed',
      timestamp: BASE_TIMESTAMP - 60_000,
    });

    await withTronFixtures(
      {
        accounts: [
          {
            address: TRON_ACCOUNT_ADDRESS,
            transactions: { raw: [sendTx] },
          },
        ],
        fixtures: new FixtureBuilderV2().build(),
        testSpecificMock: mockEvmActivityApi,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const activityTab = await landOnTronActivity(driver);

        await activityTab.checkTransactionActivityByText('Sent TRX');
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');

        await selectAllNetworksFromNetworkSelect(driver);
        await activityTab.checkTransactionActivityByText('Sent ETH');
        await activityTab.checkTransactionAmount('-1 ETH');

        // Restore the Tron-only filter so the EVM send is hidden again.
        await selectTronNetwork(driver);
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');
      },
    );
  });
});
