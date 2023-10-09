const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  WINDOW_TITLES,
  switchToNotificationWindow,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } = require('./utils');

describe('Remove Account Snap', function () {
  it('disable a snap and remove it', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlockWallet(driver);

        // Navigate to test Snaps page and connect.
        await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);

        // Connect the dapp.
        await driver.clickElement('#connectButton');
        await switchToNotificationWindow(driver);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // Scroll to the bottom of the page.
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // Click the install button to install the snap.
        await driver.waitForSelector({ text: 'Install' });
        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // Move back to the snap window to test the create account flow.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        // Check the dapp connection status.
        await driver.waitForSelector({
          css: '#snapConnected',
          text: 'Connected',
        });

        // Create new account on dapp.
        await driver.clickElement({
          text: 'Create account',
          tag: 'div',
        });
        await driver.clickElement({
          text: 'Create Account',
          tag: 'button',
        });
        await switchToNotificationWindow(driver);
        await driver.clickElement('[data-testid="confirmation-submit-button"]');
        await driver.findElement({
          tag: 'div',
          text: 'Your account is ready!',
        });

        // Click the OK button.
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // Switch back to the test dapp window.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        await driver.findElement({
          tag: 'p',
          text: 'Successful request',
        });

        // Navigate to settings.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Snaps', tag: 'div' });
        await driver.clickElement({
          text: 'MetaMask Simple Snap Keyring',
          tag: 'p',
        });

        // Disable the snap.
        await driver.clickElement('.toggle-button > div');

        // Remove the snap.
        const removeButton = await driver.findElement(
          '[data-testid="remove-snap-button"]',
        );
        await driver.scrollToElement(removeButton);
        await driver.clickElement('[data-testid="remove-snap-button"]');

        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

        await driver.fill(
          '[data-testid="remove-snap-confirmation-input"]',
          'MetaMask Simple Snap Keyring',
        );

        await driver.clickElement({
          text: 'Remove Snap',
          tag: 'button',
        });

        // Assert that the snap was removed.
        const removeResult = await driver.findElement(
          '.snap-list-tab__container--no-snaps_inner',
        );
        assert.equal(
          await removeResult.getText(),
          "You don't have any snaps installed.",
        );
      },
    );
  });
});
