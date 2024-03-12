const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  generateGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Editing Confirm Transaction', function () {
  it('goes back from confirm page to edit eth value, gas price and gas limit', async function () {
    if (process.env.MULTICHAIN) {
      return;
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerTypeOneTransaction()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        const transactionAmounts = await driver.findElements(
          '.currency-display-component__text',
        );
        const transactionAmount = transactionAmounts[0];
        assert.equal(await transactionAmount.getText(), '1');

        const transactionFee = transactionAmounts[1];
        assert.equal(await transactionFee.getText(), '0.00025');

        await driver.clickElement(
          '.confirm-page-container-header__back-button',
        );
        await driver.fill('.unit-input__input', '2.2');

        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.clickElement({ text: 'Edit', tag: 'button' });

        const [gasLimitInput, gasPriceInput] = await driver.findElements(
          'input[type="number"]',
        );
        await gasPriceInput.fill('8');
        await gasLimitInput.fill('100000');
        await driver.clickElement({ text: 'Save', tag: 'button' });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '0.0008',
        });
        await driver.waitForSelector({
          css: '.currency-display-component__suffix',
          text: 'ETH',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-2.2\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  it('goes back from confirm page to edit eth value, baseFee, priorityFee and gas limit - 1559 V2', async function () {
    if (process.env.MULTICHAIN) {
      return;
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerTypeTwoTransaction()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        const transactionAmounts = await driver.findElements(
          '.currency-display-component__text',
        );
        const transactionAmount = transactionAmounts[0];
        assert.equal(await transactionAmount.getText(), '1');

        const transactionFee = transactionAmounts[1];
        assert.equal(await transactionFee.getText(), '0.0000375');

        await driver.clickElement(
          '.confirm-page-container-header__back-button',
        );
        await driver.fill('.unit-input__input', '2.2');

        await driver.clickElement({ text: 'Next', tag: 'button' });

        // open gas fee popover
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');

        await driver.clickElement('[data-testid="edit-gas-fee-item-custom"]');

        // enter max fee
        await driver.fill('[data-testid="base-fee-input"]', '8');

        // enter priority fee
        await driver.fill('[data-testid="priority-fee-input"]', '8');

        // edit gas limit
        await driver.clickElement('[data-testid="advanced-gas-fee-edit"]');
        await driver.fill('[data-testid="gas-limit-input"]', '100000');

        // save default values
        await driver.clickElement('input[type="checkbox"]');

        // Submit gas fee changes
        await driver.clickElement({ text: 'Save', tag: 'button' });

        // has correct updated value on the confirm screen the transaction
        await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '0.0008',
        });
        await driver.waitForSelector({
          css: '.currency-display-component__suffix',
          text: 'ETH',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-2.2\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });
});
