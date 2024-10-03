import { Suite } from 'mocha';

import FixtureBuilder from '../fixture-builder';
import { defaultGanacheOptions, WINDOW_TITLES, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import { installSnapSimpleKeyring } from './common';

/**
 * Starts the flow to create a Snap account, including unlocking the wallet,
 * connecting to the test Snaps page, installing the Snap, and initiating the
 * create account process on the dapp. The function ends with switching to the
 * first confirmation in the extension.
 *
 * @param driver - The WebDriver instance used to control the browser.
 * @returns A promise that resolves when the setup steps are complete.
 */
async function startCreateSnapAccountFlow(driver: Driver): Promise<void> {
  await installSnapSimpleKeyring(driver, false);

  // move back to the Snap window to test the create account flow
  await driver.waitAndSwitchToWindowWithTitle(
    2,
    WINDOW_TITLES.SnapSimpleKeyringDapp,
  );

  // check the dapp connection status
  await driver.waitForSelector({
    css: '#snapConnected',
    text: 'Connected',
  });

  // create new account on dapp
  await driver.clickElement({
    text: 'Create account',
    tag: 'div',
  });

  await driver.clickElement({
    text: 'Create Account',
    tag: 'button',
  });

  // Wait until dialog is opened before proceeding
  await driver.waitAndSwitchToWindowWithTitle(3, WINDOW_TITLES.Dialog);
}

describe('Create Snap Account', function (this: Suite) {
  it('create Snap account popup contains correct Snap name and snapId', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the create account flow and switch to dialog window
        await startCreateSnapAccountFlow(driver);

        await driver.findElement({
          css: '[data-testid="confirmation-submit-button"]',
          text: 'Create',
        });

        await driver.findElement({
          css: '[data-testid="confirmation-cancel-button"]',
          text: 'Cancel',
        });

        await driver.findElement({
          css: '[data-testid="create-snap-account-content-title"]',
          text: 'Create account',
        });
      },
    );
  });

  it('create Snap account confirmation flow ends in approval success', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the create account flow and switch to dialog window
        await startCreateSnapAccountFlow(driver);

        // click the create button on the confirmation modal
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // click the add account button on the naming modal
        await driver.clickElement(
          '[data-testid="submit-add-account-with-name"]',
        );

        // success screen should show account created with the snap suggested name
        await driver.findElement({
          tag: 'h3',
          text: 'Account created',
        });
        await driver.findElement({
          css: '.multichain-account-list-item__account-name__button',
          text: 'SSK Account',
        });

        // click the okay button
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // switch back to the test dapp/Snap window
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        // account should be created on the dapp
        await driver.findElement({
          tag: 'p',
          text: 'Successful request',
        });

        // switch to extension full screen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // account should be created with the snap suggested name
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'SSK Account',
        });
      },
    );
  });

  it('creates multiple Snap accounts with increasing numeric suffixes', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await installSnapSimpleKeyring(driver, false);

        const expectedNames = ['SSK Account', 'SSK Account 2', 'SSK Account 3'];

        for (const [index, expectedName] of expectedNames.entries()) {
          // move to the dapp window
          await driver.waitAndSwitchToWindowWithTitle(
            2,
            WINDOW_TITLES.SnapSimpleKeyringDapp,
          );

          // create new account on dapp
          if (index === 0) {
            // Only click the div for the first snap account creation
            await driver.clickElement({
              text: 'Create account',
              tag: 'div',
            });
          }
          await driver.clickElement({
            text: 'Create Account',
            tag: 'button',
          });

          // wait until dialog is opened before proceeding
          await driver.waitAndSwitchToWindowWithTitle(3, WINDOW_TITLES.Dialog);

          // click the create button on the confirmation modal
          await driver.clickElement(
            '[data-testid="confirmation-submit-button"]',
          );

          // click the add account button on the naming modal
          await driver.clickElement(
            '[data-testid="submit-add-account-with-name"]',
          );

          // click the okay button on the success screen
          await driver.clickElement(
            '[data-testid="confirmation-submit-button"]',
          );

          // switch to extension full screen view
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // verify the account is created with the expected name
          await driver.findElement({
            css: '[data-testid="account-menu-icon"]',
            text: expectedName,
          });
        }
      },
    );
  });

  it('create Snap account confirmation flow ends in approval success with custom name input', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the create account flow and switch to dialog window
        await startCreateSnapAccountFlow(driver);

        // click the create button on the confirmation modal
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // Add a custom name to the account
        const newAccountLabel = 'Custom name';
        await driver.fill('[placeholder="SSK Account"]', newAccountLabel);
        // click the add account button on the naming modal
        await driver.clickElement(
          '[data-testid="submit-add-account-with-name"]',
        );

        // success screen should show account created with the custom name
        await driver.findElement({
          tag: 'h3',
          text: 'Account created',
        });
        await driver.findElement({
          css: '.multichain-account-list-item__account-name__button',
          text: newAccountLabel,
        });

        // click the okay button
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // switch back to the test dapp/Snap window
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        // account should be created on the dapp
        await driver.findElement({
          tag: 'p',
          text: 'Successful request',
        });

        // switch to extension full screen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // account should be created with the custom name
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: newAccountLabel,
        });
      },
    );
  });

  it('create Snap account confirmation cancellation results in error in Snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the create account flow and switch to dialog window
        await startCreateSnapAccountFlow(driver);

        // cancel account creation
        await driver.clickElement('[data-testid="confirmation-cancel-button"]');

        // switch back to the test dapp/Snap window
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        // account should not be created in Snap
        await driver.findElement({
          tag: 'p',
          text: 'Error request',
        });

        // switch to extension full screen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // account should not be created
        await driver.assertElementNotPresent({
          css: '[data-testid="account-menu-icon"]',
          text: 'SSK Account',
        });
      },
    );
  });

  it('cancelling naming Snap account results in account not created', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the create account flow and switch to dialog window
        await startCreateSnapAccountFlow(driver);

        // confirm account creation
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // click the cancel button on the naming modal
        await driver.clickElement(
          '[data-testid="cancel-add-account-with-name"]',
        );

        // switch back to the test dapp/Snap window
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        // account should not be created in Snap
        await driver.findElement({
          tag: 'p',
          text: 'Error request',
        });

        // switch to extension full screen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // account should not be created
        await driver.assertElementNotPresent({
          css: '[data-testid="account-menu-icon"]',
          text: 'SSK Account',
        });
      },
    );
  });
});
