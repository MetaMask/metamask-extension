const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Fail approved but not submitted transaction on boot', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should set the approved but not submitted transaction to failed', async function () {
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

        const completedTransactions = await driver.findElements(
          '.transaction-list__completed-transactions',
        );
        assert.equal(completedTransactions.length, 1);
        const transactionStatus = await driver.findElements(
          '.transaction-status',
        );

        assert.equal(await transactionStatus.length, 1);
      },
    );
  });
});
