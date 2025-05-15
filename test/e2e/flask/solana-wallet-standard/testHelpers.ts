import * as path from 'path';
import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import nacl from 'tweetnacl';
import { largeDelayMs, regularDelayMs, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  SOLANA_DEVNET_URL,
  withSolanaAccountSnap,
} from '../../tests/solana/common-solana';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

export const acccount1 = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';
export const account1Short = '4tE7...Uxer';
export const account2Short = 'ExTE...GNtt';

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
 * Inspired by `addAccountInWalletAndAuthorize` in test/e2e/flask/multichain-api/testHelpers.ts
 *
 * @param driver
 */
const selectAccountsAndAuthorize = async (driver: Driver): Promise<void> => {
  const editButtons = await driver.findElements('[data-testid="edit"]');
  await editButtons[0].click();

  const checkboxes = await driver.findElements('input[type="checkbox" i]');
  await checkboxes[0].click(); // select all checkbox without deselecting the already selected accounts

  await driver.clickElement({ text: 'Update', tag: 'button' });
};

/**
 * Selects the Devnet checkbox in the permissions tab.
 *
 * @param driver
 */
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

/**
 * Connects the Solana test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 * @param options
 * @param options.selectAllAccounts
 * @param options.includeDevnet
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
  await driver.delay(largeDelayMs);
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
  await console.log('connected');
};

/**
 * Waits for the Confirm button in the footer of a Solana-specific modal to be clickable then clicks it.
 * Note: This function does not work for general purpose modals like connect/disconnect.
 *
 * @param driver
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
 *
 * @param driver
 */
export const clickCancelButton = async (driver: Driver): Promise<void> => {
  const footerButtons = await driver.findClickableElements(
    By.css('button.snap-ui-renderer__footer-button'),
  );
  const cancelButton = footerButtons[0];
  await cancelButton.click();
};

/**
 * Switches to the specified account in the account menu.
 *
 * @param driver
 * @param accountName
 */
export const switchToAccount = async (
  driver: Driver,
  accountName: string,
): Promise<void> => {
  await driver.clickElementSafe('[data-testid="account-menu-icon"]');
  await driver.delay(regularDelayMs);
  await driver.clickElement({
    text: accountName,
    tag: 'button',
  });
  await driver.delay(regularDelayMs);
};

/**
 * Asserts that the connection status is as expected.
 *
 * @param connectionStatus
 * @param expectedAddress
 */
export const assertConnected = async (
  connectionStatus: 'Connected' | 'Disconnected' | string,
  expectedAddress?: string,
): Promise<void> => {
  assert.strictEqual(
    connectionStatus,
    expectedAddress ? `${expectedAddress}` : 'Connected',
    `Connection status should be ${
      expectedAddress ? `"${expectedAddress}"` : 'Connected'
    }`,
  );
};

/**
 * Asserts that the connection status is "Disconnected".
 *
 * @param connectionStatus
 */
export const assertDisconnected = async (
  connectionStatus: string,
): Promise<void> => {
  assert.strictEqual(
    connectionStatus,
    'Disconnected',
    'Connection status should be "Disconnected"',
  );
};

/**
 * Asserts that the signed message is valid.
 *
 * @param options0
 * @param options0.signedMessageBase64
 * @param options0.originalMessageString
 * @param options0.publicKeyBase58
 */
export async function assertSignedMessageIsValid({
  signedMessageBase64,
  originalMessageString,
  publicKeyBase58,
}: {
  signedMessageBase64: string;
  originalMessageString: string;
  publicKeyBase58: string;
}) {
  // To fix this issue: The current file is a CommonJS module whose imports will produce 'require' calls;
  // however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
  const bs58 = (await import('bs58')).default;
  const signature = Uint8Array.from(Buffer.from(signedMessageBase64, 'base64'));
  const publicKey = bs58.decode(publicKeyBase58);
  const message = new TextEncoder().encode(originalMessageString);

  assert.strictEqual(publicKey.length, 32, 'Invalid public key length');
  assert.strictEqual(signature.length, 64, 'Invalid signature length');

  // Verify the signature
  assert.ok(
    nacl.sign.detached.verify(message, signature, publicKey),
    'Signature verification failed',
  );
}
