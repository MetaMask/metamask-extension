import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import {
  createInternalTransactionWithMaxAmount,
  reviewTransaction,
} from '../../page-objects/flows/transaction';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { GAS_API_BASE_URL } from '../../../../shared/constants/swaps';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { validateTransaction } from '../../page-objects/flows/send-transaction.flow';
import { mockSpotPrices } from '../tokens/utils/mocks';
import GasFeeModal from '../../page-objects/pages/confirmations/redesign/gas-fee-modal';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
  // Enables advanced details due to migration 123
  useNonceField: true,
};

describe('Sending with max amount', function () {
  // This test is flaky in FF - so we are skipping it for now
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('with correct amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        driverOptions: { timeOut: 15000 },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await createInternalTransactionWithMaxAmount(driver);
        await reviewTransaction(driver);

        await driver.clickElementAndWaitToDisappear({
          text: 'Confirm',
          tag: 'button',
        });
        await validateTransaction(driver, '-24.99945808');
      },
    );
  });

  describe('gas modal changes', function () {
    it('handles custom gas fee changes', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: MockttpServer) => {
            await mockSpotPrices(mockServer, {
              'eip155:1/slip44:60': {
                price: 1700,
                marketCap: 382623505141,
                pricePercentChange1d: 0,
              },
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await createInternalTransactionWithMaxAmount(driver);
          await reviewTransaction(driver);

          const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
          const gasFeeModal = new GasFeeModal(driver);

          // open gas fee modal and set custom values
          await sendTokenConfirmPage.clickEditGasFeeIcon();
          await gasFeeModal.setCustomEIP1559GasFee({
            maxBaseFee: '30',
            priorityFee: '8.5',
            gasLimit: '100000',
          });

          // has correct updated value on the confirm screen the transaction
          await sendTokenConfirmPage.checkFirstGasFee('0.0006');
          await sendTokenConfirmPage.checkNativeCurrency('$1.00');

          // verify max amount after gas fee changes
          await driver.waitForSelector({
            text: '$42,494.90',
            tag: 'p',
          });

          // confirms the transaction
          await driver.clickElementAndWaitToDisappear({
            text: 'Confirm',
            tag: 'button',
          });

          await validateTransaction(driver, '-24.997');
        },
      );
    });

    it('handles market value changes - low', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController(PREFERENCES_STATE_MOCK)
            .build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: MockttpServer) => {
            await mockSpotPrices(mockServer, {
              'eip155:1/slip44:60': {
                price: 1700,
                marketCap: 382623505141,
                pricePercentChange1d: 0,
              },
            });
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await createInternalTransactionWithMaxAmount(driver);
          await reviewTransaction(driver);

          const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
          const gasFeeModal = new GasFeeModal(driver);

          // update estimates to low
          await sendTokenConfirmPage.clickEditGasFeeIcon();
          await gasFeeModal.selectLowGasFee();

          // has correct updated value on the confirm screen the transaction
          await sendTokenConfirmPage.checkFirstGasFee('0.0004');
          await sendTokenConfirmPage.checkNativeCurrency('$0.73');

          // verify max amount after gas fee changes
          await driver.waitForSelector({
            text: '$42,499.27',
            tag: 'p',
          });

          // confirms the transaction
          await driver.clickElementAndWaitToDisappear({
            text: 'Confirm',
            tag: 'button',
          });

          await validateTransaction(driver, '-24.99957067');
        },
      );
    });
  });

  it('adjust max amount when gas estimations changed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        driverOptions: { timeOut: 15000 },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver, mockServer }) => {
        await loginWithBalanceValidation(driver);

        await createInternalTransactionWithMaxAmount(driver);

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
        await driver.waitForSelector({
          text: '0.0009',
        });

        // verify initial max amount
        await driver.waitForSelector({
          text: '$42,498.19',
          tag: 'p',
        });

        // confirms the transaction
        await driver.clickElementAndWaitToDisappear({
          text: 'Confirm',
          tag: 'button',
        });
        await validateTransaction(driver, '-24.99893308');
      },
    );
  });

  it('does update transaction value when navigating back to edit, updating the value and navigating confirmation again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await createInternalTransactionWithMaxAmount(driver);
        await reviewTransaction(driver);
        // navigate back to edit
        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        // update the value
        await driver.fill('[data-testid="currency-input"]', '10');

        // navigate forward
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // confirms the transaction
        await driver.clickElementAndWaitToDisappear({
          text: 'Confirm',
          tag: 'button',
        });

        await validateTransaction(driver, '-10');
      },
    );
  });
});
