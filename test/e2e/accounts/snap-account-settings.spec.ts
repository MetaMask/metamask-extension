import { Suite } from 'mocha';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';

describe('Add snap account experimental settings', function (this: Suite) {
  it('switch "Enable Add account snap" to on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Make sure the "Add snap account" button is not visible.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );

        await driver.assertElementNotPresent(
          {
            text: 'Add account Snap',
            tag: 'button',
          },
          { findElementGuard: { text: 'Add a new account', tag: 'button' } }, // wait for the modal to appear
        );
        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // Navigate to experimental settings.
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        // Switch "Enable Add account Snap" to on.
        await driver.clickElement(
          '[data-testid="add-account-snap-toggle-div"]',
        );

        // Make sure the "Add account Snap" button is visible.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.findElement({
          text: 'Add account Snap',
          tag: 'button',
        });
      },
    );
  });
});
