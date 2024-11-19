const {
  defaultGanacheOptions,
  openMenuSafe,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Settings', function () {
  it('checks jazzicon and blockies icons', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // goes to the settings screen
        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });

        // finds the jazzicon toggle turned on
        await driver.findElement(
          '[data-testid="jazz_icon"] .settings-page__content-item__identicon__item__icon--active',
        );

        await driver.waitForSelector({
          tag: 'h6',
          text: 'Jazzicons',
        });

        await driver.waitForSelector({
          tag: 'h6',
          text: 'Blockies',
        });
      },
    );
  });
});
