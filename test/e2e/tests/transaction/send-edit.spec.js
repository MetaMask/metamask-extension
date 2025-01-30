const { strict: assert } = require('assert');
const {
  createInternalTransaction,
} = require('../../page-objects/flows/transaction');

const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  generateGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Editing Confirm Transaction', function () {
  it('goes back from confirm page to edit eth value, gas price and gas limit', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createInternalTransaction(driver);

        await driver.findElement({
          css: 'h2',
          text: '1 ETH',
        });

        await driver.findElement({
          css: '[data-testid="first-gas-field"]',
          text: '0 ETH',
        });

        await driver.findElement({
          css: '[data-testid="native-currency"]',
          text: '$0.07',
        });

        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        const inputAmount = await driver.findElement('input[placeholder="0"]');

        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press('2');
        await inputAmount.press('.');
        await inputAmount.press('2');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');

        const [gasLimitInput, gasPriceInput] = await driver.findElements(
          'input[type="number"]',
        );
        await gasPriceInput.fill('8');
        await gasLimitInput.fill('100000');
        await driver.clickElement({ text: 'Save', tag: 'button' });

        // has correct updated value on the confirm screen the transaction
        await driver.findElement({
          css: '[data-testid="first-gas-field"]',
          text: '0.0002 ETH',
        });

        await driver.findElement({
          css: '[data-testid="native-currency"]',
          text: '$0.29',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
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
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await createInternalTransaction(driver);

        await driver.findElement({
          css: 'h2',
          text: '1 ETH',
        });

        await driver.findElement({
          css: '[data-testid="first-gas-field"]',
          text: '0.0004 ETH',
        });

        await driver.findElement({
          css: '[data-testid="native-currency"]',
          text: '$0.75',
        });

        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        const inputAmount = await driver.findElement('input[placeholder="0"]');

        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press('2');
        await inputAmount.press('.');
        await inputAmount.press('2');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

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
        await driver.findElement({
          css: '[data-testid="first-gas-field"]',
          text: '0.0002 ETH',
        });

        await driver.findElement({
          css: '[data-testid="native-currency"]',
          text: '$0.29',
        });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
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
