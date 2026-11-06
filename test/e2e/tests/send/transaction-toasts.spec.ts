/**
 * Generic transaction toasts are off by default in E2E (see `setManifestFlags`).
 * This spec turns them on and covers the EVM and non-EVM toast paths
 * (submitted, confirmed, failed).
 */

import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  NETWORK_CLIENT_ID,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { broadcastBitcoinSend } from '../../page-objects/flows/bitcoin-send.flow';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { createInternalTransaction } from '../../page-objects/flows/transaction.flow';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
import { TxToastNotification } from '../../page-objects/components/tx-toast-notification';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../btc/mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../btc/mocks/min-api';
import {
  getMainnet25EthAssetsControllerPatch,
  mockSpotPrices,
} from '../tokens/utils/mocks';

const BTC_RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';

async function mockBtcSendMocks(mockServer: Mockttp) {
  return [
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    ...(await mockTokensV2SupportedNetworks(mockServer)),
    await mockTokensV3Assets(mockServer),
  ];
}

// The local node mines the tx, but a `status: 0x0` receipt makes
// TransactionController mark it as failed, which triggers the failed toast.
async function mockRevertedTransactionReceipt(mockServer: Mockttp) {
  return [
    await mockServer
      .forJsonRpcRequest({ method: 'eth_getTransactionReceipt' })
      .thenCallback(async (request) => {
        const body = (await request.body.getJson()) as {
          id?: number;
          params?: [string];
        };
        return {
          statusCode: 200,
          json: {
            id: body?.id,
            jsonrpc: '2.0',
            result: {
              blockHash: `0x${'1'.repeat(64)}`,
              blockNumber: '0x2',
              contractAddress: null,
              cumulativeGasUsed: '0x5208',
              effectiveGasPrice: '0x3b9aca00',
              from: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
              gasUsed: '0x5208',
              logs: [],
              logsBloom: `0x${'0'.repeat(512)}`,
              status: '0x0',
              to: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
              transactionHash: body?.params?.[0],
              transactionIndex: '0x0',
              type: '0x2',
            },
          },
        };
      }),
  ];
}

describe('Transaction toasts', function (this: Suite) {
  this.timeout(180_000);

  it('dismisses the confirmed toast and stays on the home page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        manifestFlags: { testing: { disableTransactionToasts: false } },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        await createInternalTransaction({ driver });
        await new Confirmation(driver).clickFooterButton({
          button: 'confirm',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxConfirmedToast();
        await txToast.closeToastNotification();
        await new HomePage(driver).checkPageIsLoaded();
      },
    );
  });

  it('opens transaction details from the confirmed toast', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        manifestFlags: { testing: { disableTransactionToasts: false } },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        await createInternalTransaction({ driver });
        await new Confirmation(driver).clickFooterButton({
          button: 'confirm',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxConfirmedToast();
        await txToast.openConfirmedToast();

        const transactionDetailsPage = new TransactionDetailsPage(driver);
        await transactionDetailsPage.checkPageIsLoaded();
        await transactionDetailsPage.checkStatus('Confirmed');
      },
    );
  });

  it('shows the submitted toast for a non-EVM (Bitcoin) send', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        manifestFlags: { testing: { disableTransactionToasts: false } },
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();

        await broadcastBitcoinSend({
          driver,
          recipientAddress: BTC_RECIPIENT_ADDRESS,
          amount: '0.5',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();
        await txToast.closeToastNotification();
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('shows the failed toast when the transaction reverts on-chain', async function () {
    // Mainnet instead of localhost: Chrome bypasses the proxy for loopback, so
    // only remote RPC requests (forwarded to the local node) can be mocked.
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withSmartTransactionsOptedOut()
          .withAssetsController(
            getMainnet25EthAssetsControllerPatch(
              1700,
              DEFAULT_FIXTURE_ACCOUNT_ID,
              '20',
            ),
          )
          .build(),
        manifestFlags: { testing: { disableTransactionToasts: false } },
        localNodeOptions: { hardfork: 'london', chainId: '1' },
        unifiedEvmAccountsApiBalances: { mainnetNativeEthHuman: '20' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
          return await mockRevertedTransactionReceipt(mockServer);
        },
      },
      async ({ driver }) => {
        await login(driver, {
          expectedBalance: '20 ETH',
          waitForNonEvmAccounts: false,
        });
        await createInternalTransaction({
          driver,
          chainId: '0x1',
          amount: '0.01',
        });
        await new Confirmation(driver).clickFooterButton({
          button: 'confirm',
        });

        await new TxToastNotification(driver).checkTxFailedToast();
      },
    );
  });
});
