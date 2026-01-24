import { Driver } from '../../webdriver/driver';
import {
  WINDOW_TITLES,
  TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL,
} from '../../constants';
import { regularDelayMs } from '../../helpers';
import SnapSimpleKeyringPage from '../pages/snap-simple-keyring-page';
import SnapAccountConfirmationDialog from '../pages/dialog/snap-account-confirmation-dialog';
import SnapInstall from '../pages/dialog/snap-install';

/**
 * Opens the Snap Simple Keyring dapp page and installs the snap.
 *
 * @param driver - The WebDriver instance.
 * @param isSyncFlow - Whether to enable synchronous approval. Defaults to true.
 */
export async function installSnapSimpleKeyring(
  driver: Driver,
  isSyncFlow: boolean = true,
): Promise<void> {
  await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);

  const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
  await snapSimpleKeyringPage.checkPageIsLoaded();

  // Click connect on the dapp
  await snapSimpleKeyringPage.clickConnectButton();

  // Switch to dialog and complete snap installation
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const snapInstall = new SnapInstall(driver);
  await snapInstall.clickConnectButton();
  await snapInstall.clickConfirmButton();
  await snapInstall.clickOkButton();

  // Switch back to dapp and verify connection
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);
  await snapSimpleKeyringPage.checkSimpleKeyringSnapConnected();

  if (!isSyncFlow) {
    await snapSimpleKeyringPage.toggleUseSyncApproval();
  }
}

/**
 * Creates a new snap account on the Snap Simple Keyring dapp.
 *
 * @param driver - The WebDriver instance.
 * @param options - Options for account creation.
 * @param options.isFirstAccount - Whether this is the first account. Defaults to true.
 * @returns The public address of the newly created account.
 */
export async function createSnapAccount(
  driver: Driver,
  options: {
    isFirstAccount?: boolean;
  } = {},
): Promise<string> {
  const { isFirstAccount = true } = options;

  const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
  const snapAccountDialog = new SnapAccountConfirmationDialog(driver);

  // Click create account on the dapp
  await snapSimpleKeyringPage.clickCreateAccount(isFirstAccount);

  // Switch to dialog and confirm account creation
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapAccountDialog.checkConfirmationDialogIsLoaded();
  await snapAccountDialog.clickConfirmButton();

  // Confirm account created and close dialog
  await snapAccountDialog.confirmAccountCreatedAndClose();

  // Switch back to dapp and get the new account address
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);
  return await snapSimpleKeyringPage.getNewAccountAddress();
}

/**
 * Imports an account with a private key on the Snap Simple Keyring dapp.
 *
 * @param driver - The WebDriver instance.
 * @param privateKey - The private key to import.
 */
export async function importSnapAccount(
  driver: Driver,
  privateKey: string,
): Promise<void> {
  const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
  const snapAccountDialog = new SnapAccountConfirmationDialog(driver);

  // Fill private key and click import on the dapp
  await snapSimpleKeyringPage.fillAndClickImportAccount(privateKey);

  // Switch to dialog and confirm
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await snapAccountDialog.clickConfirmButton();

  // Confirm account created and close dialog
  await snapAccountDialog.confirmAccountCreatedAndClose();

  // Switch back to dapp
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);
}

/**
 * Approves or rejects a snap account transaction from the extension dialog,
 * then handles the request on the Snap Simple Keyring dapp.
 *
 * @param driver - The WebDriver instance.
 * @param options - Options for the transaction handling.
 * @param options.approveTransaction - Whether to approve the transaction. Defaults to true.
 * @param options.isSignatureRequest - Whether this is a signature request. Defaults to false.
 */
export async function approveOrRejectSnapAccountTransaction(
  driver: Driver,
  options: {
    approveTransaction?: boolean;
    isSignatureRequest?: boolean;
  } = {},
): Promise<void> {
  const { approveTransaction = true, isSignatureRequest = false } = options;

  await driver.delay(regularDelayMs);

  // Click confirm/submit on the extension dialog
  const confirmButton = '[data-testid="confirmation-submit-button"]';
  if (isSignatureRequest) {
    await driver.clickElementAndWaitForWindowToClose(confirmButton);
  } else {
    await driver.clickElementAndWaitToDisappear(confirmButton);
  }

  // Switch to the snap keyring dapp
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

  const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

  // Get the pending request ID
  const requestId = await snapSimpleKeyringPage.getFirstPendingRequestId();

  // Approve or reject the request
  if (approveTransaction) {
    await snapSimpleKeyringPage.approveRequest(requestId);
  } else {
    await snapSimpleKeyringPage.rejectRequest(requestId);
  }

  // Switch back to extension
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
}

/**
 * Cancels snap account creation on the confirmation screen.
 *
 * @param driver - The WebDriver instance.
 */
export async function cancelSnapAccountCreation(driver: Driver): Promise<void> {
  const snapAccountDialog = new SnapAccountConfirmationDialog(driver);
  await snapAccountDialog.clickCancelButton();
}
