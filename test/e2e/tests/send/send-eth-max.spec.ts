/**
 * Send ETH - Max Amount Tests
 *
 * Tests for sending the maximum available ETH balance:
 * - Max amount calculation
 * - Gas fee changes affecting max amount
 * - Custom gas values with max amount
 */

import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createInternalTransactionWithMaxAmount } from '../../page-objects/flows/transaction';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { GAS_API_BASE_URL } from '../../../../shared/constants/swaps';
import { login } from '../../page-objects/flows/login.flow';
import { validateTransaction } from '../../page-objects/flows/send-transaction.flow';
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

        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();
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
          await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

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
          await driver.waitForSelector({
            text: '$42,499.27',
            tag: 'p',
          });

          // confirms the transaction
          await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

          await validateTransaction(driver, '-24.99957065');
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
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();
        await validateTransaction(driver, '-24.99893303');
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
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await validateTransaction(driver, '-10');
      },
    );
  });
});
