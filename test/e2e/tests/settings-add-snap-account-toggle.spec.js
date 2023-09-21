const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Add snap account experimental settings', function () {
  it('switch "Enable Add snap account" to on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Make sure the "Add snap account" button is not visible.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.assertElementNotPresent({
          text: 'Add snap account',
          tag: 'button',
        });
        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // Navigate to experimental settings.
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        // Switch "Enable Add snap account" to on.
        const toggle = await driver.findElement(
          '[data-testid="add-snap-account-toggle"]',
        );
        await driver.scrollToElement(toggle);
        await driver.clickElement('[data-testid="add-snap-account-toggle"]');

        // Make sure the "Add snap account" button is visible.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert.equal(
          await driver.isElementPresentAndVisible({
            text: 'Add snap account',
            tag: 'button',
          }),
          true,
        );
      },
    );
  });
});
