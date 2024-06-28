import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import {
  waitForNotificationWindowDuringAccountCreationFlow
} from './common';

import {
  defaultGanacheOptions,
  switchToNotificationWindow,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../helpers';
import { Driver } from '../webdriver/driver';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../constants';

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
  await unlockWallet(driver);

  // navigate to test Snaps page and connect
  await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);
  await driver.clickElement('#connectButton');

  // switch to metamask extension and click connect to start installing the snap
  await switchToNotificationWindow(driver);
  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
  });

  // scroll to the bottom of the page
  await driver.waitForSelector({ text: 'Confirm' });
  await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

  // click the install button to install the snap
  await driver.waitForSelector({ text: 'Confirm' });
  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
  });
  await driver.waitForSelector({ text: 'OK' });
  await driver.clickElement({
    text: 'OK',
    tag: 'button',
  });

  // move back to the Snap window to test the create account flow
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

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

  await switchToNotificationWindow(driver);
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
        await startCreateSnapAccountFlow(driver);

        await driver.findElement({
          css: '[data-testid="confirmation-submit-button"]',
          text: 'Create',
        });

        // FIXME: We need to re-open the notification window, since it gets closed after
        // the first part of the flow
        await waitForNotificationWindowDuringAccountCreationFlow(driver);
        await switchToNotificationWindow(driver);

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
        await startCreateSnapAccountFlow(driver);

        // click the create button on the confirmation modal
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // FIXME: We need to re-open the notification window, since it gets closed after
        // the first part of the flow
        await waitForNotificationWindowDuringAccountCreationFlow(driver);
        await switchToNotificationWindow(driver);

        // click the add account button on the naming modal
        await driver.clickElement(
          '[data-testid="submit-add-account-with-name"]',
        );

        // success screen should show account created with the default name
        await driver.findElement({
          tag: 'h3',
          text: 'Account created',
        });
        await driver.findElement({
          css: '.multichain-account-list-item__account-name__button',
          text: 'Snap Account 1',
        });

        // click the okay button
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // switch back to the test dapp/Snap window
        await driver.switchToWindowWithTitle(
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

        // account should be created with the default name
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Snap Account 1',
        });
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
        await startCreateSnapAccountFlow(driver);

        // click the create button on the confirmation modal
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // FIXME: We need to re-open the notification window, since it gets closed after
        // the first part of the flow
        await waitForNotificationWindowDuringAccountCreationFlow(driver);
        await switchToNotificationWindow(driver);

        // Add a custom name to the account
        const newAccountLabel = 'Custom name';
        await driver.fill('[placeholder="Snap Account 1"]', newAccountLabel);
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
        await driver.switchToWindowWithTitle(
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
        await startCreateSnapAccountFlow(driver);

        // cancel account creation
        await driver.clickElement('[data-testid="confirmation-cancel-button"]');

        // switch back to the test dapp/Snap window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        // account should not be created in Snap
        await driver.findElement({
          tag: 'p',
          text: 'Error request',
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
        await startCreateSnapAccountFlow(driver);

        // confirm account creation
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // FIXME: We need to re-open the notification window, since it gets closed after
        // the first part of the flow
        await waitForNotificationWindowDuringAccountCreationFlow(driver);
        await switchToNotificationWindow(driver);

        // click the cancel button on the naming modal
        await driver.clickElement(
          '[data-testid="cancel-add-account-with-name"]',
        );

        // switch to extension full screen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // account should not be created
        await driver.assertElementNotPresent({
          css: '[data-testid="account-menu-icon"]',
          text: 'Snap Account 1',
        });
      },
    );
  });
});
