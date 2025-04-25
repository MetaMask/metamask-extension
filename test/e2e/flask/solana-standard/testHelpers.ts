import * as path from 'path';
import { strict as assert } from 'assert';
import { largeDelayMs, regularDelayMs, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  SOLANA_DEVNET_URL,
  withSolanaAccountSnap,
} from '../solana/common-solana';
import { By } from 'selenium-webdriver';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

/**
 * Default options for setting up Solana E2E test environment
 */
export const DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS = {
  dappPaths: [
    path.join(
      '..',
      '..',
      'node_modules',
      '@metamask',
      'test-dapp-solana',
      'dist',
    ),
  ],
} satisfies Parameters<typeof withSolanaAccountSnap>[0];

/**
 * Connects the Solana test dapp to the wallet.
 */
export const connectSolanaTestDapp = async (
  driver: Driver,
  testDapp: TestDappSolana,
  options: {
    selectAllAccounts?: boolean;
    includeDevnet?: boolean;
  } = {},
): Promise<void> => {
  const header = await testDapp.getHeader();
  // Set the endpoint to devnet
  await header.setEndpoint(SOLANA_DEVNET_URL);
  await driver.clickElement({ text: 'Update', tag: 'button' });

  await header.connect();

  // wait to display wallet connect modal
  await driver.delay(regularDelayMs);

  const modal = await testDapp.getWalletModal();
  await modal.connectToMetaMaskWallet();

  // Get to extension modal, and click on the "Connect" button
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  if (options?.selectAllAccounts) {
    await selectAccountsAndAuthorize(driver);
  }
  if (options?.includeDevnet) {
    await selectDevnet(driver);
  }
  await driver.clickElementAndWaitForWindowToClose({
    text: 'Connect',
    tag: 'button',
  });

  // Go back to the test dapp window
  await testDapp.switchTo();
};

/**
 * Waits for the Confirm button in the footer of a Solana-specific modal to be clickable then clicks it.
 * Note: This function does not work for general purpose modals like connect/disconnect.
 */
export const clickConfirmButton = async (driver: Driver): Promise<void> => {
  const footerButtons = await driver.findClickableElements(
    By.css('button.snap-ui-renderer__footer-button'),
  );
  const confirmButton = footerButtons[1];
  await confirmButton.click();
};

/**
 * Clicks the Cancel button in the footer in a Solana-specific modal.
 * Note: This function does not work for general purpose modals like connect/disconnect.
 */
export const clickCancelButton = async (driver: Driver): Promise<void> => {
  const footerButtons = await driver.findClickableElements(
    By.css('button.snap-ui-renderer__footer-button'),
  );
  const cancelButton = footerButtons[0];
  await cancelButton.click();
};

/**
 * Inspired by `addAccountInWalletAndAuthorize` in test/e2e/flask/multichain-api/testHelpers.ts
 */
const selectAccountsAndAuthorize = async (driver: Driver): Promise<void> => {
  const editButtons = await driver.findElements('[data-testid="edit"]');
  await editButtons[0].click();

  const checkboxes = await driver.findElements('input[type="checkbox" i]');
  await checkboxes[0].click(); // select all checkbox

  await driver.clickElement({ text: 'Update', tag: 'button' });
};

const selectDevnet = async (driver: Driver): Promise<void> => {
  const permissionsTab = await driver.findElement(
    '[data-testid="permissions-tab"]',
  );
  await permissionsTab.click();
  const editButtons = await driver.findElements('[data-testid="edit"]');
  await editButtons[1].click();
  await driver.delay(largeDelayMs);
  const networkListItems = await driver.findElements(
    '.multichain-network-list-item',
  );

  for (const item of networkListItems) {
    const networkNameDiv = await item.findElement(By.css('div[data-testid]'));
    const network = await networkNameDiv.getAttribute('data-testid');
    if (network === 'Solana Devnet') {
      const checkbox = await item.findElement(By.css('input[type="checkbox"]'));
      const isChecked = await checkbox.isSelected();

      if (!isChecked) {
        await checkbox.click();
      }
      break;
    }
  }
  await driver.clickElement({ text: 'Update', tag: 'button' });
};

export const switchToAccount = async (
  driver: Driver,
  accountName: string,
): Promise<void> => {
  await driver.clickElementSafe('[data-testid="account-menu-icon"]');
  await driver.clickElement({
    text: accountName,
    tag: 'button',
  });
};

export const assertConnected = async (
  connectionStatus: 'Connected' | 'Disconnected' | string,
  expectedAddress?: string,
): Promise<void> => {
  assert.strictEqual(
    connectionStatus,
    expectedAddress ? `${expectedAddress}` : 'Connected',
    `Connection status should be ${expectedAddress ? `"${expectedAddress}"` : 'Connected'}`,
  );

};

export const assertDisconnected = async (
  connectionStatus: string,
): Promise<void> => {
  assert.strictEqual(
    connectionStatus,
    'Disconnected',
    'Connection status should be "Disconnected"',
  );
};