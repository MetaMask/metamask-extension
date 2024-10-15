import { privateToAddress } from 'ethereumjs-util';
import messages from '../../../app/_locales/en/messages.json';
import FixtureBuilder from '../fixture-builder';
import {
  PRIVATE_KEY,
  PRIVATE_KEY_TWO,
  WINDOW_TITLES,
  multipleGanacheOptions,
} from '../helpers';
import { Driver } from '../webdriver/driver';

/**
 * These are fixtures specific to Account Snap E2E tests:
 * -- connected to Test Dapp
 * -- two private keys with 25 ETH each
 *
 * @param title
 */
export const accountSnapFixtures = (title: string | undefined) => {
  return {
    dapp: true,
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp({
        restrictReturnedAccounts: false,
      })
      .build(),
    ganacheOptions: multipleGanacheOptions,
    title,
  };
};

// convert PRIVATE_KEY to public key
export const PUBLIC_KEY = privateToAddress(
  Buffer.from(PRIVATE_KEY.slice(2), 'hex'),
).toString('hex');

export async function importKeyAndSwitch(driver: Driver) {
  await driver.clickElement({
    text: 'Import account',
    tag: 'div',
  });

  await driver.fill('#import-account-private-key', PRIVATE_KEY_TWO);

  await driver.clickElement({
    text: 'Import Account',
    tag: 'button',
  });

  // Click "Create" on the Snap's confirmation popup
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({
    css: '[data-testid="confirmation-submit-button"]',
    text: 'Create',
  });
  // Click the add account button on the naming modal
  await driver.clickElement({
    css: '[data-testid="submit-add-account-with-name"]',
    text: 'Add account',
  });
  // Click the ok button on the success modal
  await driver.clickElement({
    css: '[data-testid="confirmation-submit-button"]',
    text: 'Ok',
  });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

  await switchToAccount2(driver);
}

async function switchToAccount2(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // click on Accounts
  await driver.clickElement('[data-testid="account-menu-icon"]');

  await driver.clickElement({
    tag: 'Button',
    text: 'SSK Account',
  });

  await driver.assertElementNotPresent({
    tag: 'header',
    text: 'Select an account',
  });
}

export async function createBtcAccount(driver: Driver) {
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement({
    text: messages.addNewBitcoinAccount.message,
    tag: 'button',
  });
  await driver.clickElementAndWaitToDisappear(
    {
      text: 'Add account',
      tag: 'button',
    },
    // Longer timeout than usual, this reduces the flakiness
    // around Bitcoin account creation (mainly required for
    // Firefox)
    5000,
  );
}
