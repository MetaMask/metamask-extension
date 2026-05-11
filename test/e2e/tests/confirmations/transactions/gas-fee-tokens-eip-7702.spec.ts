import { Anvil } from '@viem/anvil';
import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { RelayStatus } from '../../../../../app/scripts/lib/transaction/transaction-relay';
import { TX_SENTINEL_URL } from '../../../../../shared/constants/transaction';
import { decimalToHex } from '../../../../../shared/lib/conversion.utils';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import GasFeeTokenModal from '../../../page-objects/pages/confirmations/gas-fee-token-modal';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import { Driver } from '../../../webdriver/driver';
import { mockEip7702FeatureFlag } from '../helpers';
import { getMockAssetsPrice, mockSpotPrices } from '../../tokens/utils/mocks';
import { login } from '../../../page-objects/flows/login.flow';

const ETH_CONVERSION_RATE_USD = 1700;

const UUID = '1234-5678';
const TRANSACTION_HASH =
  '0xf25183af3bf64af01e9210201a2ede3c1dcd6d16091283152d13265242939fc4';

// Token addresses returned in the simulated `tokenFees` response below.
const USDC_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const DAI_ADDRESS = '0x01234567890abcdef1234567890abcdef1234567';
const USDC_ASSET_ID = `eip155:1/erc20:${USDC_ADDRESS}`;
const DAI_ASSET_ID = `eip155:1/erc20:${DAI_ADDRESS}`;

const SPOT_PRICES = {
  'eip155:1/slip44:60': {
    price: ETH_CONVERSION_RATE_USD,
    marketCap: 382623505141,
    pricePercentChange1d: 0,
  },
  [DAI_ASSET_ID]: { price: 1, marketCap: 0, pricePercentChange1d: 0 },
  [USDC_ASSET_ID]: { price: 1, marketCap: 0, pricePercentChange1d: 0 },
};

describe('Gas Fee Tokens - EIP-7702', function (this: Suite) {
  it('confirms transaction if successful', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withSmartTransactionsOptedOut()
          .withAssetsController({
            assetsPrice: getMockAssetsPrice(ETH_CONVERSION_RATE_USD),
          })
          .build(),
        localNodeOptions: {
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockEip7702FeatureFlag(mockServer);
          mockTransactionRelayNetworks(mockServer);
          mockTransactionRelaySubmit(mockServer);
          mockTransactionRelayStatus(mockServer);
          mockSmartTransactionFeatureFlags(mockServer);
          mockTokenAssets(mockServer);
          mockTokensSupportedNetworks(mockServer);
          mockSpotPrices(mockServer, SPOT_PRICES);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await login(driver, { expectedBalance: '0' });

        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);

        await transactionConfirmation.clickAdvancedDetailsButton();
        await transactionConfirmation.closeGasFeeToastMessage();
        await transactionConfirmation.clickGasFeeTokenPill();

        const gasFeeTokenModal = new GasFeeTokenModal(driver);
        await gasFeeTokenModal.checkAmountFiat('DAI', '$3.21');
        await gasFeeTokenModal.checkAmountToken('DAI', '3.21 DAI');
        await gasFeeTokenModal.checkBalance('DAI', '$10.00');

        await gasFeeTokenModal.checkAmountFiat('USDC', '$1.23');
        await gasFeeTokenModal.checkAmountToken('USDC', '1.23 USDC');
        await gasFeeTokenModal.checkBalance('USDC', '$5.00');
        await gasFeeTokenModal.clickToken('USDC');
        await transactionConfirmation.closeGasFeeToastMessage();

        await transactionConfirmation.checkGasFeeSymbol('USDC');
        await transactionConfirmation.checkGasFeeTokenFee('$0.43');
        await transactionConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('fails transaction if error', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withAssetsController({
            assetsPrice: getMockAssetsPrice(ETH_CONVERSION_RATE_USD),
          })
          .build(),
        localNodeOptions: {
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockEip7702FeatureFlag(mockServer);
          mockTransactionRelayNetworks(mockServer);
          mockTransactionRelaySubmit(mockServer);
          mockTransactionRelayStatus(mockServer, { success: false });
          mockSmartTransactionFeatureFlags(mockServer);
          mockSpotPrices(mockServer, SPOT_PRICES);
          mockTokenAssets(mockServer);
          mockTokensSupportedNetworks(mockServer);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await login(driver, { expectedBalance: '0' });
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.closeGasFeeToastMessage();
        await transactionConfirmation.clickGasFeeTokenPill();

        const gasFeeTokenModal = new GasFeeTokenModal(driver);
        await gasFeeTokenModal.clickToken('USDC');
        await transactionConfirmation.closeGasFeeToastMessage();

        await transactionConfirmation.checkGasFeeSymbol('USDC');
        await transactionConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkFailedTxNumberDisplayedInActivity(1);
      },
    );
  });
});

async function mockSimulationResponse(mockServer: MockttpServer) {
  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('simulateTransactions')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          result: {
            transactions: [
              {
                return:
                  '0x0000000000000000000000000000000000000000000000000000000000000000',
                status: '0x1',
                gasUsed: '0x5de2',
                gasLimit: '0x5f34',
                fees: [
                  {
                    maxFeePerGas: '0xf19b9f48d',
                    maxPriorityFeePerGas: '0x9febc9',
                    balanceNeeded: '0x59d9d3b865ed8',
                    currentBalance: '0x77f9fd8d99e7e0',
                    error: '',
                    tokenFees: [
                      {
                        token: {
                          address: USDC_ADDRESS,
                          decimals: 6,
                          symbol: 'USDC',
                        },
                        balanceNeededToken: '0x12C4B0',
                        currentBalanceToken: '0x4C4B40',
                        feeRecipient:
                          '0xBAB951a55b61dfAe21Ff7C3501142B397367F026',
                        rateWei: '0x216FF33813A80',
                        serviceFee: `0x${decimalToHex(430000)}`,
                      },
                      {
                        token: {
                          address: DAI_ADDRESS,
                          decimals: 3,
                          symbol: 'DAI',
                        },
                        balanceNeededToken: '0xC8A',
                        currentBalanceToken: '0x2710',
                        feeRecipient:
                          '0xBAB951a55b61dfAe21Ff7C3501142B397367F026',
                        rateWei: '0x216FF33813A80',
                      },
                    ],
                  },
                ],
                stateDiff: {},
                feeEstimate: 972988071597550,
                baseFeePerGas: 40482817574,
              },
            ],
            blockNumber: '0x1293669',
            id: 'faaab4c5-edf5-4077-ac75-8d26278ca2c5',
          },
        },
      };
    });
}

async function mockTransactionRelayNetworks(mockServer: MockttpServer) {
  await mockServer
    .forGet(`${TX_SENTINEL_URL}/networks`)
    .always()
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          '1': {
            network: 'ethereum-mainnet',
            confirmations: true,
            relayTransactions: true,
            sendBundle: true,
          },
        },
      };
    });
}

async function mockTransactionRelaySubmit(mockServer: MockttpServer) {
  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('eth_sendRelayTransaction')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          result: {
            uuid: UUID,
          },
        },
      };
    });
}

async function mockTransactionRelayStatus(
  mockServer: MockttpServer,
  { success }: { success?: boolean } = { success: true },
) {
  await mockServer
    .forGet(`${TX_SENTINEL_URL}/smart-transactions/${UUID}`)
    .always()
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          transactions: [
            {
              hash: TRANSACTION_HASH,
              status: success ? RelayStatus.Success : 'FAILED',
            },
          ],
        },
      };
    });
}

async function mockSmartTransactionFeatureFlags(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://bridge.api.cx.metamask.io/featureFlags')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {},
      };
    });
}

// Test-only DAI/USDC token addresses are not in any real registry, so the
// global `/v3/assets` mock returns nothing for them. Provide metadata here so
// the AssetsController can resolve symbols/decimals for the gas-fee tokens.
async function mockTokenAssets(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const assetIds = url.searchParams.get('assetIds') ?? '';
      const lower = assetIds.toLowerCase();
      const results: unknown[] = [];

      if (lower.includes('eip155:1/slip44:60')) {
        results.push({
          assetId: 'eip155:1/slip44:60',
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        });
      }
      if (lower.includes(DAI_ADDRESS.toLowerCase())) {
        results.push({
          assetId: DAI_ASSET_ID,
          name: 'Dai Stablecoin',
          symbol: 'DAI',
          decimals: 3,
        });
      }
      if (lower.includes(USDC_ADDRESS.toLowerCase())) {
        results.push({
          assetId: USDC_ASSET_ID,
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
        });
      }

      return { statusCode: 200, json: results };
    });
}

async function mockTokensSupportedNetworks(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v2/supportedNetworks')
    .always()
    .thenJson(200, {
      fullSupport: ['eip155:1', 'eip155:1337'],
      partialSupport: [],
    });
}
