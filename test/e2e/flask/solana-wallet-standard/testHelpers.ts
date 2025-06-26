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
import AccountListPage from '../../page-objects/pages/account-list-page';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

export const account1 = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';
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

const selectAccountsAndAuthorize = async (driver: Driver): Promise<void> => {
  console.log(
    'select all accounts without deselecting the already selected accounts',
  );
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.check_pageIsLoaded();
  await connectAccountConfirmation.openEditAccountsModal();

  const editConnectedAccountsModal = new EditConnectedAccountsModal(driver);
  await editConnectedAccountsModal.check_pageIsLoaded();
  await editConnectedAccountsModal.selectAllAccounts();
};

/**
 * Selects the Devnet checkbox in the permissions tab.
 *
 * @param driver
 */
const selectDevnet = async (driver: Driver): Promise<void> => {
  console.log('select devnet on permissions tab');

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.check_pageIsLoaded();
  await connectAccountConfirmation.goToPermissionsTab();
  await connectAccountConfirmation.openEditNetworksModal();

  const networkPermissionSelectModal = new NetworkPermissionSelectModal(driver);
  await networkPermissionSelectModal.check_pageIsLoaded();
  await networkPermissionSelectModal.selectNetwork('Solana Devnet');
  await networkPermissionSelectModal.clickConfirmEditButton();
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
  console.log('connect solana test dapp');
  await testDapp.check_pageIsLoaded();
  const header = await testDapp.getHeader();
  // Set the endpoint to devnet
  await header.setEndpoint(SOLANA_DEVNET_URL);
  await testDapp.clickUpdateEndpointButton();

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

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.check_pageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  // Go back to the test dapp window
  await testDapp.switchTo();
  console.log('solana test dapp connected');
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
  const nonEvmHomepage = new NonEvmHomepage(driver);
  await nonEvmHomepage.check_pageIsLoaded();
  await nonEvmHomepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.check_pageIsLoaded();
  await accountListPage.check_accountDisplayedInAccountList(accountName);
  await accountListPage.switchToAccount(accountName);
  await nonEvmHomepage.headerNavbar.check_accountLabel(accountName);
  await nonEvmHomepage.check_pageIsLoaded();
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
