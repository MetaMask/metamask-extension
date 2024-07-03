import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import FixtureBuilder from '../fixture-builder';
import {
  WALLET_PASSWORD,
  WINDOW_TITLES,
  completeSRPRevealQuiz,
  defaultGanacheOptions,
  openSRPRevealQuiz,
  switchToNotificationWindow,
  tapAndHoldToRevealSRP,
  unlockWallet,
  withFixtures,
} from '../helpers';
import { Driver } from '../webdriver/driver';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../constants';
import { createBtcAccount } from './common';

describe('Create Snap Account', function (this: Suite) {
  it('create Snap account popup contains correct Snap name and snapId', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
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
        await driver.switchToWindowWithTitle(
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

        await switchToNotificationWindow(driver);

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
        await driver.switchToWindowWithTitle(
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

        await switchToNotificationWindow(driver);

        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        await driver.findElement({
          tag: 'h3',
          text: 'Account created',
        });

        // click the okay button
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // switch back to the test dapp/Snap window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        await driver.findElement({
          tag: 'p',
          text: 'Successful request',
        });

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Snap Account 1',
        });
      },
    );
  });

  it('create Snap account confirmation cancelation results in error in Snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
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
        await driver.switchToWindowWithTitle(
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

        // switch to metamask extension
        await switchToNotificationWindow(driver);

        // cancel account creation
        await driver.clickElement('[data-testid="confirmation-cancel-button"]');

        // switch back to the test dapp/Snap window
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );

        await driver.findElement({
          tag: 'p',
          text: 'Error request',
        });
      },
    );
  });

  it('create BTC account from the menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });
      },
    );
  });

  it('cannot create multiple BTC accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await createBtcAccount(driver);
        await createBtcAccount(driver);

        // modal will still be here
        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // check the number of accounts. it should only be 2.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const menuItems = await driver.findElements(
          '.multichain-account-list-item',
        );
        assert.equal(menuItems.length, 2);
      },
    );
  });

  it('can cancel the removal of BTC account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        // const accountAddress =

        // Remove account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-remove"]');
        await driver.clickElement({ text: 'Nevermind', tag: 'button' });

        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });
      },
    );
  });

  it('can recreate BTC account after deleting it', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement('[data-testid="account-list-menu-details"]');

        const accountAddress = await (
          await driver.findElement('[data-testid="address-copy-button-text"]')
        ).getText();

        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // Remove account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-remove"]');
        await driver.clickElement({ text: 'Remove', tag: 'button' });

        // Recreate account
        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement('[data-testid="account-list-menu-details"]');

        const recreatedAccountAddress = await (
          await driver.findElement('[data-testid="address-copy-button-text"]')
        ).getText();

        await driver.clickElement('.mm-box button[aria-label="Close"]');

        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });

  it.only('can recreate BTC account after restoring wallet with srp', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement('[data-testid="account-list-menu-details"]');

        const accountAddress = await (
          await driver.findElement('[data-testid="address-copy-button-text"]')
        ).getText();

        await driver.clickElement('.mm-box button[aria-label="Close"]');

        await openSRPRevealQuiz(driver);
        await completeSRPRevealQuiz(driver);
        await driver.fill('[data-testid="input-password"]', WALLET_PASSWORD);
        await driver.press('[data-testid="input-password"]', driver.Key.ENTER);
        await tapAndHoldToRevealSRP(driver);
        const seedPhrase = await (
          await driver.findElement('[data-testid="srp_text"]')
        ).getText();

        // Reset wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        const lockButton = await driver.findClickableElement(
          '[data-testid="global-menu-lock"]',
        );
        assert.equal(await lockButton.getText(), 'Lock MetaMask');
        await lockButton.click();

        await driver.clickElement({
          text: 'Forgot password?',
          tag: 'a',
        });

        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          seedPhrase,
        );

        await driver.fill(
          '[data-testid="create-vault-password"]',
          WALLET_PASSWORD,
        );
        await driver.fill(
          '[data-testid="create-vault-confirm-password"]',
          WALLET_PASSWORD,
        );

        await driver.clickElement({
          text: 'Restore',
          tag: 'button',
        });

        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement('[data-testid="account-list-menu-details"]');

        const recreatedAccountAddress = await (
          await driver.findElement('[data-testid="address-copy-button-text"]')
        ).getText();

        await driver.clickElement('.mm-box button[aria-label="Close"]');

        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });
});
