const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  generateGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Editing Confirm Transaction', function () {
  it('approves a transaction stuck in approved state on boot', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerApprovedTransaction()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
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
