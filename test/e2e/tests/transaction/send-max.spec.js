const { strict: assert } = require('assert');

const {
  withFixtures,
  unlockWallet,
  generateGanacheOptions,
} = require('../../helpers');
const {
  createInternalTransactionWithMaxAmount,
} = require('../../page-objects/flows/transaction');
const FixtureBuilder = require('../../fixture-builder');
const { GAS_API_BASE_URL } = require('../../../../shared/constants/swaps');

describe('Sending with max amount', function () {
  it('with correct amount', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createInternalTransactionWithMaxAmount(driver);

        // verify initial max amount
        await driver.waitForSelector({
          text: '$42,499.08',
          tag: 'p',
        });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '[data-testid="first-gas-field"]',
          text: '0.0004 ETH',
        });

        await driver.waitForSelector({
          css: '[data-testid="native-currency"]',
          text: '$0.75',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxs = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxs.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-24.99945808\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  describe('gas modal changes', function () {
    it('handles custom gas fee changes', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController({
              preferences: {
                showFiatInTestnets: true,
              },
            })
            .build(),
          localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await createInternalTransactionWithMaxAmount(driver);

          // verify initial max amount
          await driver.waitForSelector({
            text: '$42,499.08',
            tag: 'p',
          });

          // has correct updated value on the confirm screen the transaction
          await driver.waitForSelector({
            css: '[data-testid="first-gas-field"]',
            text: '0.0004 ETH',
          });

          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.75',
          });

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
            text: '0.0006 ETH',
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
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.wait(async () => {
            const confirmedTxs = await driver.findElements(
              '.transaction-list__completed-transactions .activity-list-item',
            );
            return confirmedTxs.length === 1;
          }, 10000);

          const txValues = await driver.findElements(
            '[data-testid="transaction-list-item-primary-currency"]',
          );
          assert.equal(txValues.length, 1);
          assert.ok(/-24.997\s*ETH/u.test(await txValues[0].getText()));
        },
      );
    });

    it('handles market value changes - low', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController({
              preferences: {
                showFiatInTestnets: true,
              },
            })
            .build(),
          localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await createInternalTransactionWithMaxAmount(driver);

          // verify initial max amount
          await driver.waitForSelector({
            text: '$42,499.08',
            tag: 'p',
          });

          // has correct updated value on the confirm screen the transaction
          await driver.waitForSelector({
            css: '[data-testid="first-gas-field"]',
            text: '0.0004 ETH',
          });

          await driver.waitForSelector({
            css: '[data-testid="native-currency"]',
            text: '$0.75',
          });

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
            text: '0.0004 ETH',
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
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.wait(async () => {
            const confirmedTxs = await driver.findElements(
              '.transaction-list__completed-transactions .activity-list-item',
            );
            return confirmedTxs.length === 1;
          }, 10000);

          const txValues = await driver.findElements(
            '[data-testid="transaction-list-item-primary-currency"]',
          );
          assert.equal(txValues.length, 1);
          assert.ok(/-24.99957067\s*ETH/u.test(await txValues[0].getText()));
        },
      );
    });
  });

  it('adjust max amount when gas estimations changed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
        testSpecificMock: (mockServer) => {
          mockServer
            .forGet(`${GAS_API_BASE_URL}/networks/1337/suggestedGasFees`)
            .thenCallback(() => {
              return {
                json: {
                  low: {
                    suggestedMaxPriorityFeePerGas: '1',
                    suggestedMaxFeePerGas: '20.44436136',
                    minWaitTimeEstimate: 15000,
                    maxWaitTimeEstimate: 30000,
                  },
                  medium: {
                    suggestedMaxPriorityFeePerGas: '1.5',
                    suggestedMaxFeePerGas: '25.80554517',
                    minWaitTimeEstimate: 15000,
                    maxWaitTimeEstimate: 45000,
                  },
                  high: {
                    suggestedMaxPriorityFeePerGas: '2',
                    suggestedMaxFeePerGas: '27.277766977',
                    minWaitTimeEstimate: 15000,
                    maxWaitTimeEstimate: 60000,
                  },
                  estimatedBaseFee: '19.444436136',
                  networkCongestion: 0.14685,
                  latestPriorityFeeRange: ['0.378818859', '6.555563864'],
                  historicalPriorityFeeRange: ['0.1', '248.262969261'],
                  historicalBaseFeeRange: ['14.146999781', '28.825256275'],
                  priorityFeeTrend: 'down',
                  baseFeeTrend: 'up',
                },
                statusCode: 200,
              };
            });
        },
      },
      async ({ driver, mockServer }) => {
        await unlockWallet(driver);

        await createInternalTransactionWithMaxAmount(driver);

        // verify initial max amount
        await driver.waitForSelector({
          text: '$42,499.08',
          tag: 'p',
        });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '[data-testid="first-gas-field"]',
          text: '0.0004 ETH',
        });

        await driver.waitForSelector({
          css: '[data-testid="native-currency"]',
          text: '$0.75',
        });

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

        // wait for the gas fee to change
        await driver.waitForSelector({
          text: '0.0005 ETH',
        });

        // verify initial max amount
        await driver.waitForSelector({
          text: '$42,498.19',
          tag: 'p',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxs = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxs.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-24.99893308\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  it('does update transaction value when navigating back to edit, updating the value and navigating confirmation again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        localNodeOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createInternalTransactionWithMaxAmount(driver);

        // verify initial max amount
        await driver.waitForSelector({
          text: '$42,499.08',
          tag: 'p',
        });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '[data-testid="first-gas-field"]',
          text: '0.0004 ETH',
        });

        await driver.waitForSelector({
          css: '[data-testid="native-currency"]',
          text: '$0.75',
        });

        //navigate back to edit
        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        // update the value
        await driver.fill('[data-testid="currency-input"]', '10');

        // navigate forward
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );
        await driver.wait(async () => {
          const confirmedTxs = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxs.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-10\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });
});
