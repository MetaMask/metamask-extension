const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  defaultGanacheOptions,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Eth sign', function () {
  it('will detect if eth_sign is disabled', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#ethSign');

        await driver.delay(1000);
        const ethSignButton = await driver.findElement('#ethSign');
        const exceptionString =
          'ERROR: ETH_SIGN HAS BEEN DISABLED. YOU MUST ENABLE IT IN THE ADVANCED SETTINGS';
        // TODO the error should be different now...
        assert.equal(await ethSignButton.getText(), exceptionString);
      },
    );
  });
});
