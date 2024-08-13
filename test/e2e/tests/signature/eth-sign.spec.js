const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  defaultGanacheOptions,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Eth sign', function () {
  it('will throw method not found error', async function () {
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
          'ERROR: THE METHOD "ETH_SIGN" DOES NOT EXIST / IS NOT AVAILABLE.';
        assert.equal(await ethSignButton.getText(), exceptionString);
      },
    );
  });
});
