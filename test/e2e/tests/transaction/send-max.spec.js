const { withFixtures } = require('../../helpers');
const {
  createInternalTransactionWithMaxAmount,
  reviewTransaction,
} = require('../../page-objects/flows/transaction');
const FixtureBuilder = require('../../fixture-builder');
const { GAS_API_BASE_URL } = require('../../../../shared/constants/swaps');
const {
  loginWithBalanceValidation,
} = require('../../page-objects/flows/login.flow');
const {
  validateTransaction,
} = require('../../page-objects/flows/send-transaction.flow');

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
        title: this.test.fullTitle(),
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
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await createInternalTransactionWithMaxAmount(driver);
          await reviewTransaction(driver);
          // update estimates to high
          await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
          await driver.waitForSelector({
            text: 'sec',
            tag: 'span',
          });
          await driver.clickElement('[data-testid="edit-gas-fee-item-custom"]');

          // enter max fee
          await driver.fill('[data-testid="base-fee-input"]', '30');

          // enter priority fee
          await driver.fill('[data-testid="priority-fee-input"]', '8.5');

          // edit gas limit
          await driver.clickElement('[data-testid="advanced-gas-fee-edit"]');
          await driver.fill('[data-testid="gas-limit-input"]', '100000');

          // Submit gas fee changes
          await driver.clickElement({ text: 'Save', tag: 'button' });

          // has correct updated value on the confirm screen the transaction
          await driver.waitForSelector({
            css: '[data-testid="first-gas-field"]',
            text: '0.0006',
          });

          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$1.00',
          });

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
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await createInternalTransactionWithMaxAmount(driver);
          await reviewTransaction(driver);
          // update estimates to high
          await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
          await driver.waitForSelector({
            text: 'sec',
            tag: 'span',
          });
          await driver.clickElement('[data-testid="edit-gas-fee-item-low"]');

          // has correct updated value on the confirm screen the transaction
          await driver.waitForSelector({
            css: '[data-testid="first-gas-field"]',
            text: '0.0004',
          });

          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.73',
          });

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
        title: this.test.fullTitle(),
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
        title: this.test.fullTitle(),
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
