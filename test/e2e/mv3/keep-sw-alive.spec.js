const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const {
  withFixtures,
  defaultGanacheOptions,
  WALLET_PASSWORD,
  unlockWallet,
} = require('../helpers');

describe('keep sw alive', function () {
  it('should keep sw alive', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
        dapp: true,
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        // await driver.openNewPage(`http://127.0.0.1:8080`);

        await addNewAccount(driver, 'Test Account');

        const PREVIOUS_SERVICE_WORKER_DELAY = 5 * 60 * 1000;
        // const value = await driver.executeScript(`return chrome`);

        // console.log({ value });

        await driver.delay(PREVIOUS_SERVICE_WORKER_DELAY);

        await addNewAccount(driver, 'Test Account #2');

        await driver.clickElement('[data-testid="account-menu-icon"]');

        assert.equal(
          await driver.isElementPresentAndVisible({
            text: 'Test Account',
            tag: 'button',
          }),
          true,
        );

        console.log(1);
        assert.equal(
          await driver.isElementPresentAndVisible({
            text: 'Test Account #2',
            tag: 'button',
          }),
          true,
        );
      },
    );
  });
});

async function addNewAccount(driver, accountName) {
  await driver.clickElement('[data-testid="account-menu-icon"]');

  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );

  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-add-account"]',
  );

  await driver.fill('input', accountName);

  await driver.clickElement({ text: 'Create', tag: 'button' });
}
