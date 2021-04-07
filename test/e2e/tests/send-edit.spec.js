const { strict: assert } = require('assert');
const { Key, until } = require('selenium-webdriver');
const {
  withFixtures,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
} = require('../helpers');

describe('Editing Confirm Transaction', function () {
  it('goes back from confirm page to edit eth value, gas price and gas limit', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      {
        fixtures: 'send-edit',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        const passwordField = await driver.findElement('#password');
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);

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
        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.clear();
        await inputAmount.sendKeys('2.2');

        await driver.clickElement('.advanced-gas-options-btn');
        await driver.delay(regularDelayMs);

        const gasModal = await driver.findElement('span .modal');

        const [gasPriceInput, gasLimitInput] = await driver.findElements(
          '.advanced-gas-inputs__gas-edit-row__input',
        );

        await gasPriceInput.clear();
        await gasPriceInput.sendKeys('8');
        await driver.delay(tinyDelayMs);

        await gasLimitInput.clear();
        await gasLimitInput.sendKeys('100000');
        await driver.delay(largeDelayMs);

        await driver.clickElement({ text: 'Save', tag: 'button' });
        await driver.wait(until.stalenessOf(gasModal));
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // has correct updated value on the confirm screen the transaction
        const editedTransactionAmounts = await driver.findElements(
          '.currency-display-component__text',
        );
        const editedTransactionAmount = editedTransactionAmounts[0];
        assert.equal(await editedTransactionAmount.getText(), '2.2');

        const editedTransactionFee = editedTransactionAmounts[1];
        assert.equal(await editedTransactionFee.getText(), '0.0008');

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '.transaction-list-item__primary-currency',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-2.2\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });
});
