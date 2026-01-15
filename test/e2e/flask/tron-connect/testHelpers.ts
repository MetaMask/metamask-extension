import * as path from 'path';
import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { Driver } from '../../webdriver/driver';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';
import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import { withTronAccountSnap, DEFAULT_MESSAGE_SIGNATURE } from './common-tron';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

enum ConnectionStatus {
  Connected = 'Connected',
  NotConnected = 'Not connected',
}

/**
 * Default options for setting up Tron E2E test environment
 */
export const DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS = {
  dappPaths: [
    path.join(
      '..',
      '..',
      'node_modules',
      '@metamask',
      'test-dapp-tron',
      'dist',
    ),
  ],
} satisfies Parameters<typeof withTronAccountSnap>[0];

/**
 * Connects the Tron test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 * @param options
 * @param options.selectAllAccounts
 * @param options.includeTestnet
 * @param options.onboard
 * @param options.includeDevnet
 */
export const connectTronTestDapp = async (
  driver: Driver,
  testDapp: TestDappTron,
  options: {
    onboard?: boolean;
    selectAllAccounts?: boolean;
    includeDevnet?: boolean;
  } = {},
): Promise<void> => {
  await testDapp.checkPageIsLoaded();
  await driver.delay(largeDelayMs);
  const header = await testDapp.getHeader();

  await header.connect();

  // wait to display wallet connect modal
  await driver.delay(largeDelayMs);

  const modal = await testDapp.getWalletModal();
  await modal.connectToMetaMaskWallet();

  // Get to extension modal, and click on the "Connect" button
  await driver.delay(largeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  // Go back to the test dapp window
  await testDapp.switchTo();
};

/**
 * Asserts that the connection status is as expected.
 *
 * @param connectionStatus
 * @param expectedAddress
 */
export const assertConnected = (
  connectionStatus: string,
  expectedAddress?: string,
): void => {
  assert.strictEqual(
    connectionStatus,
    expectedAddress ? `${expectedAddress}` : ConnectionStatus.Connected,
    `Connection status should be ${
      expectedAddress ? `"${expectedAddress}"` : ConnectionStatus.Connected
    }`,
  );
};

/**
 * Asserts that the connection status is "Not connected".
 *
 * @param connectionStatus
 */
export const assertDisconnected = (connectionStatus: string): void => {
  assert.strictEqual(
    connectionStatus,
    ConnectionStatus.NotConnected,
    `Connection status should be "${ConnectionStatus.NotConnected}"`,
  );
};

/**
 * Waits for the Confirm button in the footer of a Tron-specific modal to be clickable then clicks it.
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
 * Asserts that the signed message is valid.
 *
 * @param signature - The signature to verify.
 * @returns void
 */
export const assertSignedMessageIsValid = async (signature: string) => {
  assert.equal(
    signature,
    DEFAULT_MESSAGE_SIGNATURE
  );
};

/**
 * Asserts that the required properties for a signed transaction are present.
 *
 * @param transaction.transaction
 * @param transaction - The transaction to verify.
 * @returns void
 */
export const assertSignedTransactionIsValid = ({
  transaction,
}: {
  transaction: any;
}) => {
  assert.ok(transaction.txID);
  assert.ok(transaction.raw_data_hex);
  assert.ok(transaction.raw_data);
  assert.ok(transaction.signature);
  assert.ok(transaction.signature[0]);
  assert.equal(transaction.signature[0].length, 132);
};
