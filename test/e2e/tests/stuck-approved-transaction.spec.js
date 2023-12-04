const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Editing Confirm Transaction', function () {
  it('approves a transaction stuck in approved state on boot', async function () {
    const ganacheOptions = {
      hardfork: 'london',
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerApprovedTransaction()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

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
        assert.ok(/-1\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });
});
