/**
 * Send ETH - Max Amount Tests
 *
 * Tests for sending the maximum available ETH balance:
 * - Max amount calculation
 * - Gas fee changes affecting max amount
 * - Custom gas values with max amount
 * - Native max on a non-default EVM chain, where fee estimates are read by
 *   hex chain id and the gas API is keyed by the decimal id
 */

import { toHex } from '@metamask/controller-utils';
import type {
  GasFeeEstimates,
  GasFeeStateFeeMarket,
} from '@metamask/gas-fee-controller';
import {
  type NetworkConfiguration,
  NetworkStatus,
  RpcEndpointType,
} from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createInternalTransactionWithMaxAmount } from '../../page-objects/flows/transaction.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { GAS_API_BASE_URL } from '../../../../shared/constants/swaps';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
} from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import {
  sendNativeMaxAndCheckConfirmedActivity,
  validateTransaction,
} from '../../page-objects/flows/send-transaction.flow';
import { mockEthPrices } from '../tokens/utils/mocks';
import GasFeeModal from '../../page-objects/pages/confirmations/gas-fee-modal';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
  // Enables advanced details due to migration 123
  useNonceField: true,
};

/**
 * With assets-unify enabled (forced on in test builds),
 * `getCurrencyRateControllerCurrencyRates` derives the ETH conversion rate from
 * AssetsController.assetsPrice keyed by the first native EVM entry in assetsInfo
 * (lexicographic = eip155:1/slip44:60 = mainnet).
 *
 * FixtureBuilder v1 starts from default-fixture.js which has no
 * AssetsController, so we must seed both assetsInfo (so the selector has entries
 * to iterate) and assetsPrice (so it can read the price) for the native ETH
 * assets the tests rely on.
 */
const ETH_NATIVE_INFO = {
  aggregators: [],
  decimals: 18,
  image: '',
  name: 'Ethereum',
  symbol: 'ETH',
  type: 'native' as const,
};

const ASSETS_PRICE_ETH_1700 = {
  assetPriceType: 'fungible' as const,
  id: 'ethereum',
  lastUpdated: 0,
  price: 1700,
  usdPrice: 1700,
};

const ASSETS_CONTROLLER_ETH_1700 = {
  assetsInfo: {
    'eip155:1/slip44:60': ETH_NATIVE_INFO,
    'eip155:1337/slip44:1': ETH_NATIVE_INFO,
  },
  assetsPrice: {
    'eip155:1/slip44:60': ASSETS_PRICE_ETH_1700,
    'eip155:1337/slip44:1': ASSETS_PRICE_ETH_1700,
  },
};

const ETH_USD_PRICE = 1700;

// Not a built-in chain. Its hex id (`0x67932`) is not the decimal id
// (`424242`) the gas API uses. Native max reads `gasFeeEstimatesByChainId`
// by exact key and does not wait for a gas poll, so estimates for this chain
// must already be present. Localhost cases stay on `0x539` and would not
// catch a miss on another chain.
const CUSTOM_EVM_CHAIN_ID_DECIMAL = 424242;
const CUSTOM_EVM_CHAIN_ID = toHex(CUSTOM_EVM_CHAIN_ID_DECIMAL) as Hex;
const CUSTOM_EVM_CHAIN_ID_DECIMAL_KEY = String(CUSTOM_EVM_CHAIN_ID_DECIMAL);
const CUSTOM_EVM_CLIENT_ID = 'custom-evm';
const CUSTOM_EVM_NATIVE_ASSET_ID = `eip155:${CUSTOM_EVM_CHAIN_ID_DECIMAL}/slip44:60`;
const ANVIL_BALANCE_HEX = '0x15af1d78b58c40000';
const ANVIL_BALANCE_ETH = '25';
const CUSTOM_EVM_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

// Fees are high enough that reserving gas moves the confirmation heading
// below 25. A normal ~20 gwei fee is smaller than the heading's rounding
// step, so "24.999 ETH" is shown as "25 ETH".
const CUSTOM_EVM_SUGGESTED_GAS_FEES: GasFeeEstimates = {
  low: {
    suggestedMaxPriorityFeePerGas: '100',
    suggestedMaxFeePerGas: '1000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 30000,
  },
  medium: {
    suggestedMaxPriorityFeePerGas: '100',
    suggestedMaxFeePerGas: '1000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 45000,
  },
  high: {
    suggestedMaxPriorityFeePerGas: '100',
    suggestedMaxFeePerGas: '1000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
  },
  estimatedBaseFee: '900',
  networkCongestion: 0.14685,
  latestPriorityFeeRange: ['100', '100'],
  historicalPriorityFeeRange: ['100', '100'],
  historicalBaseFeeRange: ['900', '900'],
  priorityFeeTrend: 'down',
  baseFeeTrend: 'up',
};

const CUSTOM_EVM_GAS_FEE_STATE: GasFeeStateFeeMarket = {
  estimatedGasFeeTimeBounds: {},
  gasEstimateType: 'fee-market',
  gasFeeEstimates: CUSTOM_EVM_SUGGESTED_GAS_FEES,
};

/**
 * Custom EVM network whose RPC is the local Anvil node.
 *
 * @returns Network configuration selected by the fixture.
 */
function customEvmNetworkConfiguration(): NetworkConfiguration {
  return {
    blockExplorerUrls: ['https://custom-evm.example'],
    chainId: CUSTOM_EVM_CHAIN_ID,
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Custom EVM',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: CUSTOM_EVM_CLIENT_ID,
        type: RpcEndpointType.Custom,
        url: 'http://localhost:8545',
      },
    ],
  };
}

/**
 * Builds a fixture for a native max send on a non-default chain.
 * Fee estimates are seeded before the send because native max reads
 * `gasFeeEstimatesByChainId` by exact key and does not wait for a gas poll.
 * The gas API itself is keyed by the decimal network id.
 *
 * @returns Fixture state for the custom-chain max-send flow.
 */
function buildCustomEvmMaxSendFixture() {
  return new FixtureBuilderV2()
    .withNetworkController({
      selectedNetworkClientId: CUSTOM_EVM_CLIENT_ID,
      networkConfigurationsByChainId: {
        [CUSTOM_EVM_CHAIN_ID]: customEvmNetworkConfiguration(),
      },
      networksMetadata: {
        [CUSTOM_EVM_CLIENT_ID]: {
          EIPS: { 1559: true },
          status: NetworkStatus.Available,
        },
      },
    })
    .withEnabledNetworks({
      eip155: { [CUSTOM_EVM_CHAIN_ID]: true },
    })
    .withAccountTracker({
      accountsByChainId: {
        [CUSTOM_EVM_CHAIN_ID]: {
          [DEFAULT_FIXTURE_ACCOUNT]: {
            balance: ANVIL_BALANCE_HEX,
            stakedBalance: '0x0',
          },
        },
      },
    })
    .withAssetsController({
      assetsInfo: {
        [CUSTOM_EVM_NATIVE_ASSET_ID]: ETH_NATIVE_INFO,
      },
      assetsBalance: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: {
          [CUSTOM_EVM_NATIVE_ASSET_ID]: { amount: ANVIL_BALANCE_ETH },
        },
      },
      assetsPrice: {
        'eip155:1/slip44:60': ASSETS_PRICE_ETH_1700,
        [CUSTOM_EVM_NATIVE_ASSET_ID]: ASSETS_PRICE_ETH_1700,
      },
    })
    .withGasFeeController({
      gasEstimateType: 'fee-market',
      gasFeeEstimates: CUSTOM_EVM_SUGGESTED_GAS_FEES,
      gasFeeEstimatesByChainId: {
        [CUSTOM_EVM_CHAIN_ID]: CUSTOM_EVM_GAS_FEE_STATE,
        [CUSTOM_EVM_CHAIN_ID_DECIMAL_KEY]: CUSTOM_EVM_GAS_FEE_STATE,
      },
    })
    .build();
}

/**
 * Mocks gas, token, and ETH price HTTP for the custom chain. The gas API
 * route uses the decimal network id.
 *
 * @param mockServer - Mockttp server for this test.
 */
async function mockCustomEvmMaxSendApis(
  mockServer: MockttpServer,
): Promise<void> {
  await mockServer
    .forGet(
      `${GAS_API_BASE_URL}/networks/${CUSTOM_EVM_CHAIN_ID_DECIMAL_KEY}/suggestedGasFees`,
    )
    .asPriority(99)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: CUSTOM_EVM_SUGGESTED_GAS_FEES,
    }));

  await mockServer
    .forGet(
      `https://token.api.cx.metamask.io/tokens/${CUSTOM_EVM_CHAIN_ID_DECIMAL_KEY}`,
    )
    .asPriority(99)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [],
    }));

  await mockEthPrices(mockServer, ETH_USD_PRICE, [CUSTOM_EVM_CHAIN_ID]);
}

describe('Send ETH - Max Amount', function () {
  // This test is flaky in FF - so we are skipping it for now
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('sends with correct amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .withAssetsController(ASSETS_CONTROLLER_ETH_1700)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        driverOptions: { timeOut: 15000 },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockEthPrices(mockServer, ETH_USD_PRICE, [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.LOCALHOST,
          ]);
        },
      },
      async ({ driver }) => {
        await login(driver);

        await createInternalTransactionWithMaxAmount({ driver });
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkGasFeeFiat('$0.75');

        await transactionConfirmation.clickFooterButton({
          button: 'confirm',
          waitUntil: 'disappear',
        });
        await validateTransaction(driver, '-24.99945808');
      },
    );
  });

  describe('Gas modal changes', function () {
    it('handles custom gas fee changes', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .withAssetsController(ASSETS_CONTROLLER_ETH_1700)
            .build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: MockttpServer) => {
            await mockEthPrices(mockServer, ETH_USD_PRICE, [
              CHAIN_IDS.MAINNET,
              CHAIN_IDS.LOCALHOST,
            ]);
          },
        },
        async ({ driver }) => {
          await login(driver);

          await createInternalTransactionWithMaxAmount({ driver });
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkGasFeeFiat('$0.75');

          const gasFeeModal = new GasFeeModal(driver);

          // open gas fee modal and set custom values
          await transactionConfirmation.openGasFeeModal();
          await gasFeeModal.setCustomEIP1559GasFee({
            maxBaseFee: '30',
            priorityFee: '8.5',
            gasLimit: '100000',
          });

          // has correct updated value on the confirm screen the transaction
          await transactionConfirmation.checkGasFeeFiat('$1.00');

          // verify max amount after gas fee changes
          await transactionConfirmation.checkSendAmountConversion('$42,494.90');

          // confirms the transaction
          await transactionConfirmation.clickFooterButton({
            button: 'confirm',
            waitUntil: 'disappear',
          });

          await validateTransaction(driver, '-24.997');
        },
      );
    });

    it('handles market value changes - low', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .withAssetsController(ASSETS_CONTROLLER_ETH_1700)
            .build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: MockttpServer) => {
            await mockEthPrices(mockServer, ETH_USD_PRICE, [
              CHAIN_IDS.MAINNET,
              CHAIN_IDS.LOCALHOST,
            ]);
          },
        },
        async ({ driver }) => {
          await login(driver);

          await createInternalTransactionWithMaxAmount({ driver });
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkGasFeeFiat('$0.75');

          const gasFeeModal = new GasFeeModal(driver);

          // update estimates to low
          await transactionConfirmation.openGasFeeModal();
          await gasFeeModal.checkPageIsLoaded();
          await gasFeeModal.selectLowGasFee();

          // has correct updated value on the confirm screen the transaction
          await transactionConfirmation.checkGasFeeFiat('$0.73');

          // verify max amount after gas fee changes
          await transactionConfirmation.checkSendAmountConversion('$42,499.27');

          // confirms the transaction
          await transactionConfirmation.clickFooterButton({
            button: 'confirm',
            waitUntil: 'disappear',
          });

          await validateTransaction(driver, '-24.9996');
        },
      );
    });
  });

  it('adjusts max amount when gas estimations change', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .withAssetsController(ASSETS_CONTROLLER_ETH_1700)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        driverOptions: { timeOut: 15000 },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockEthPrices(mockServer, ETH_USD_PRICE, [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.LOCALHOST,
          ]);
        },
      },
      async ({ driver, mockServer }) => {
        await login(driver);

        await createInternalTransactionWithMaxAmount({ driver });

        mockServer
          .forGet(`${GAS_API_BASE_URL}/networks/1337/suggestedGasFees`)
          .thenCallback(() => {
            return {
              json: {
                low: {
                  suggestedMaxPriorityFeePerGas: '1',
                  suggestedMaxFeePerGas: '40.44436136',
                  minWaitTimeEstimate: 15000,
                  maxWaitTimeEstimate: 30000,
                },
                medium: {
                  suggestedMaxPriorityFeePerGas: '1.5',
                  suggestedMaxFeePerGas: '50.80554517',
                  minWaitTimeEstimate: 15000,
                  maxWaitTimeEstimate: 45000,
                },
                high: {
                  suggestedMaxPriorityFeePerGas: '2',
                  suggestedMaxFeePerGas: '60.277766977',
                  minWaitTimeEstimate: 15000,
                  maxWaitTimeEstimate: 60000,
                },
                estimatedBaseFee: '39.444436136',
                networkCongestion: 0.30685,
                latestPriorityFeeRange: ['0.378818859', '6.555563864'],
                historicalPriorityFeeRange: ['0.1', '248.262969261'],
                historicalBaseFeeRange: ['14.146999781', '28.825256275'],
                priorityFeeTrend: 'down',
                baseFeeTrend: 'up',
              },
              statusCode: 200,
            };
          });

        // verify gas fee changed
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkGasFeeFiat('$1.46');

        // verify initial max amount
        await transactionConfirmation.checkSendAmount('25 ETH');
        await transactionConfirmation.checkSendAmountConversion('$42,498.19');

        // confirms the transaction
        await transactionConfirmation.clickFooterButton({
          button: 'confirm',
          waitUntil: 'disappear',
        });
        await validateTransaction(driver, '-24.9989');
      },
    );
  });

  // https://github.com/MetaMask/MetaMask-planning/issues/6679
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('updates transaction value when navigating back to edit', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .withAssetsController(ASSETS_CONTROLLER_ETH_1700)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockEthPrices(mockServer, ETH_USD_PRICE, [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.LOCALHOST,
          ]);
        },
      },
      async ({ driver }) => {
        await login(driver);

        await createInternalTransactionWithMaxAmount({ driver });
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkGasFeeFiat('$0.75');
        // navigate back to edit
        await transactionConfirmation.clickBackButton();

        const sendPage = new SendPage(driver);
        await sendPage.fillAmount('10'); // update the value
        await sendPage.pressContinueButton();

        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.clickFooterButton({
          button: 'confirm',
          waitUntil: 'disappear',
        });

        await validateTransaction(driver, '-10');
      },
    );
  });

  it('confirms a native max send below the balance on a non-default chain id', async function () {
    await withFixtures(
      {
        fixtures: buildCustomEvmMaxSendFixture(),
        localNodeOptions: {
          chainId: CUSTOM_EVM_CHAIN_ID_DECIMAL,
          hardfork: 'london',
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockCustomEvmMaxSendApis,
      },
      async ({ driver }) => {
        await sendNativeMaxAndCheckConfirmedActivity({
          driver,
          chainId: CUSTOM_EVM_CHAIN_ID,
          recipientAddress: CUSTOM_EVM_RECIPIENT,
          availableBalance: ANVIL_BALANCE_ETH,
        });
      },
    );
  });
});
