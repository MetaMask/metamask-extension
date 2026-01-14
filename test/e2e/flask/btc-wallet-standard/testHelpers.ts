import * as path from 'path';
import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { largeDelayMs, regularDelayMs, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { withBtcAccountSnap } from '../btc/common-btc';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { DEFAULT_BTC_ADDRESS } from '../../constants';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

export const account1Short = `${DEFAULT_BTC_ADDRESS.slice(0, 4)}...${DEFAULT_BTC_ADDRESS.slice(-4)}`;
export const txHashShort = `f632...2f78`

/**
 * Default options for setting up Bitcoin E2E test environment
 */
export const DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS = {
  numberOfAccounts: 1,
  dappPaths: [
    path.join(
      '..',
      '..',
      'node_modules',
      '@metamask',
      'test-dapp-bitcoin',
      'dist',
    ),
  ],
} satisfies Parameters<typeof withBtcAccountSnap>[0];

/* const onboardBitcoinAccount = async (driver: Driver): Promise<void> => {
  console.log('onboarding a new bitcoin account');

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.isCreateBitcoinAccountModalButtonVisible();
  await connectAccountConfirmation.createCreateBitcoinAccountFromModal();
}; */

/* const selectAccountsAndAuthorize = async (driver: Driver): Promise<void> => {
  console.log(
    'select all accounts without deselecting the already selected accounts',
  );
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.openEditAccountsModal();

  const editConnectedAccountsModal = new EditConnectedAccountsModal(driver);
  await editConnectedAccountsModal.checkPageIsLoaded();
  await editConnectedAccountsModal.selectAllAccounts();
}; */

/**
 * Selects the Devnet checkbox in the permissions tab.
 *
 * @param driver
 */
/* const selectDevnet = async (driver: Driver): Promise<void> => {
  console.log('select devnet on permissions tab');

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.goToPermissionsTab();
  await connectAccountConfirmation.openEditNetworksModal();

  const networkPermissionSelectModal = new NetworkPermissionSelectModal(driver);
  await networkPermissionSelectModal.checkPageIsLoaded();
  await networkPermissionSelectModal.selectNetwork({
    networkName: 'Bitcoin Devnet',
  });
  await networkPermissionSelectModal.clickConfirmEditButton();
}; */

/**
 * Connects the Bitcoin test dapp to the wallet.
 *
 * @param driver
 * @param testDapp
 * @param options
 * @param options.selectAllAccounts
 * @param options.includeDevnet
 * @param options.onboard
 */
export const connectBitcoinTestDapp = async (
  driver: Driver,
  testDapp: TestDappBitcoin,
  options: {
    onboard?: boolean;
    selectAllAccounts?: boolean;
    includeDevnet?: boolean;
    connectionLibrary?: 'sats-connect' | 'wallet-standard';
  } = {},
): Promise<void> => {
  console.log('connect bitcoin test dapp');
  await testDapp.checkPageIsLoaded();
  const header = await testDapp.getHeader();

  await header.connect();

  // wait to display wallet connect modal
  await driver.delay(regularDelayMs);

  const modal = await testDapp.getWalletModal();
  await modal.connectToMetaMaskWallet(options.connectionLibrary);

  // Get to extension modal, and click on the "Connect" button
  await driver.delay(largeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();

  // Go back to the test dapp window
  await testDapp.switchTo();
  console.log('bitcoin test dapp connected');
};

/**
 * Waits for the Confirm button in the footer of a Bitcoin-specific modal to be clickable then clicks it.
 * Note: This function does not work for general purpose modals like connect/disconnect.
 *
 * @param driver
 */
export const clickConfirmButton = async (driver: Driver): Promise<void> => {
  await driver.clickElement({text: 'Approve'});
};

/**
 * Clicks the Cancel button in the footer in a Bitcoin-specific modal.
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
  await nonEvmHomepage.checkPageIsLoaded();
  await nonEvmHomepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.checkAccountDisplayedInAccountList(accountName);
  await accountListPage.switchToAccount(accountName);
  await nonEvmHomepage.headerNavbar.checkAccountLabel(accountName);
  await nonEvmHomepage.checkPageIsLoaded();
};

enum ConnectionStatus {
  Connected = 'Connected',
  NotConnected = 'Not connected',
}

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
