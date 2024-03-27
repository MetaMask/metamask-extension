const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
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
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });

        // finds the jazzicon toggle turned on
        await driver.findElement(
          '[data-testid="jazz_icon"] .settings-page__content-item__identicon__item__icon--active',
        );

        const jazziconText = await driver.findElement({
          tag: 'h6',
          text: 'Jazzicons',
        });
        assert.equal(
          await jazziconText.getText(),
          'Jazzicons',
          'Text for icon should be Jazzicons',
        );

        const blockiesText = await driver.findElement({
          tag: 'h6',
          text: 'Blockies',
        });
        assert.equal(
          await blockiesText.getText(),
          'Blockies',
          'Text for icon should be Blockies',
        );
      },
    );
  });
});
