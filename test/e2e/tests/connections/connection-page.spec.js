const { strict: assert } = require('assert');
const { LavaDomeDebug } = require('@lavamoat/lavadome-core');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { tEn } = require('../../../lib/i18n-helpers');

describe('Show account details', function () {

  it('should show connections page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="connection-status"]');
        await driver.findElement(
                  '.hidden-accounts-list',
                );
      },
    );
  });


});
