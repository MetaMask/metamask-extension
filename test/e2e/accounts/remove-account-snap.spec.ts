import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import { WINDOW_TITLES, defaultGanacheOptions, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import { installSnapSimpleKeyring, makeNewAccountAndSwitch } from './common';

describe('Remove Account Snap', function (this: Suite) {
  it('disable a snap and remove it', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await installSnapSimpleKeyring(driver, false);

        await makeNewAccountAndSwitch(driver);

        // Navigate to settings.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

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

        // Checking result modal
        await driver.findVisibleElement({
          text: 'MetaMask Simple Snap Keyring removed',
          tag: 'p',
        });

        // Assert that the snap was removed.
        await driver.findElement({
          css: '.mm-box',
          text: "You don't have any snaps installed.",
          tag: 'p',
        });
      },
    );
  });
});
