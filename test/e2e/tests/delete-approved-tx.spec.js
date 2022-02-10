const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Delete approved but not submitted transaction', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should delete the approved but not submitted transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'approved-tx',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement({
          text: 'Activity',
          tag: 'button',
        });

        await driver.findElements('.transaction-list__pending-transactions');
        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-0 ETH',
          },
          { timeout: 10000 },
        );

        const cancelButton = await driver.findElement(
          '.transaction-list-item__pending-actions button.btn-secondary',
        );
        await driver.clickElement(cancelButton);

        await cancelButton.waitForElementState('hidden');

        const pendingTxes = await driver.findElements(
          '.transaction-list__pending-transactions .transaction-list-item',
        );
        assert.equal(
          pendingTxes.length,
          1,
          'deleted transaction from pending tx list',
        );
      },
    );
  });
});
