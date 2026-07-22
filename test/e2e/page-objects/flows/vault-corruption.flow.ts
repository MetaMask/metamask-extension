import { WALLET_PASSWORD } from '../../constants';
import { type Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import HeaderNavbar from '../pages/header-navbar';
import AccountListPage from '../pages/account-list-page';
import AccountAddressModal from '../pages/multichain/account-address-modal';
import AddressListModal from '../pages/multichain/address-list-modal';
import CriticalErrorPage from '../pages/critical-error-page';
import VaultRecoveryPage from '../pages/vault-recovery-page';
import {
  completeCreateNewWalletOnboardingFlow,
  type OnboardingMetricsFlowOptions,
} from './onboarding.flow';
import { lockAndWaitForLoginPage } from './login.flow';

/**
 * Returns the first (truncated) address from the account list in UI.
 *
 * @param driver - The WebDriver instance.
 * @param headerNavbar - Optional HeaderNavbar instance to reuse.
 * @param options - Optional settings.
 * @param options.waitForSync - Whether to wait for multichain account syncing
 * to finish. Default true. Set to false when syncing is irrelevant (e.g.
 * reading an existing account address after a backup restore).
 * @returns The first account's address.
 */
export async function getFirstAddress(
  driver: Driver,
  headerNavbar: HeaderNavbar = new HeaderNavbar(driver),
  { waitForSync = true }: { waitForSync?: boolean } = {},
): Promise<string> {
  await headerNavbar.checkPageIsLoaded();
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  if (waitForSync) {
    await accountListPage.waitUntilSyncingIsCompleted(20000);
  }
  await accountListPage.openMultichainAccountMenu({
    accountLabel: 'Account 1',
  });

  await accountListPage.clickMultichainAccountMenuItem('Addresses');

  const addressListModal = new AddressListModal(driver);
  await addressListModal.clickQRbutton();

  const accountAddressModal = new AccountAddressModal(driver);
  const accountAddress = await accountAddressModal.getAccountAddress();
  await accountAddressModal.goBack();
  await addressListModal.goBack();
  await accountListPage.closeMultichainAccountsPage();

  return accountAddress;
}

/**
 * Simple script that reloads the extension.
 * Used when manifest flags (e.g. simulateStorageGetFailure, simulateBackgroundInitializationHang)
 * handle the simulation after backup exists.
 */
export const simpleReloadScript = `
  const callback = arguments[arguments.length - 1];
  const browser = globalThis.browser ?? globalThis.chrome;
  browser.runtime.reload();
  callback();
`;

/**
 * Script to read the encrypted vault from the IndexedDB backup database.
 * Resolves with the encrypted vault string, or `null` if it isn't present yet.
 *
 * Must be run via `executeAsyncScript` on an extension page (e.g. the login or
 * home page) so it can access the extension's IndexedDB.
 */
export const getBackupVaultScript = `
  const callback = arguments[arguments.length - 1];
  const request = globalThis.indexedDB.open('metamask-backup', 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('store')) {
      db.createObjectStore('store');
    }
  };
  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction('store', 'readonly');
    const store = transaction.objectStore('store');
    const getRequest = store.get('KeyringController');
    getRequest.onsuccess = () => {
      const keyringController = getRequest.result;
      callback(keyringController?.vault ?? null);
    };
    getRequest.onerror = () => callback(null);
  };
  request.onerror = () => callback(null);
`;

/**
 * Reads the encrypted vault from the IndexedDB backup database.
 *
 * @param driver - The WebDriver instance. Must currently be on an extension page
 * (e.g. the login or home page) so the script can access the extension's IndexedDB.
 * @returns The encrypted vault string, or `null` if it isn't present.
 */
export async function getBackupVault(driver: Driver): Promise<string | null> {
  return (await driver.executeAsyncScript(getBackupVaultScript)) as
    | string
    | null;
}

/**
 * Waits for the encrypted vault to be written to the IndexedDB backup database.
 *
 * The backup write is asynchronous and debounced, so without this guard the
 * corruption flow can break `storage.local` and reload the extension before the
 * backup has been committed.
 *
 * @param driver - The WebDriver instance. Must currently be on an extension page
 * (e.g. the login page) so the script can access the extension's IndexedDB.
 * @param timeoutMs - How long to wait for the backup.
 */
export async function waitForBackupVault(
  driver: Driver,
  timeoutMs = 10000,
): Promise<void> {
  await driver.wait(async () => {
    const backupVault = await getBackupVault(driver);
    return Boolean(backupVault);
  }, timeoutMs);
}

/**
 * Onboards a new wallet, then executes a script.
 *
 * This flow:
 * 1. Opens a spare tab (to prevent browser from closing when extension reloads)
 * 2. Completes new wallet onboarding
 * 3. Gets the first account's address
 * 4. Locks the wallet
 * 5. Executes the corruption script
 * 6. Waits for the vault recovery page to appear
 *
 * @param driver - The WebDriver instance.
 * @param script - The script to run (e.g. corruption script, or simpleReloadScript).
 * @param options - Additional options.
 * @param options.optedIn - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @returns The initial first account's address (before the script ran).
 */
export async function onboardThenExecuteScript(
  driver: Driver,
  script: string,
  { optedIn = false }: OnboardingMetricsFlowOptions = {},
): Promise<string> {
  const initialWindow = await driver.driver.getWindowHandle();

  // open a spare tab so the browser doesn't exit once we `reload()` the
  // extension process, as doing so will close all UI tabs we have open when
  // we do -- and that will close the whole browser 😱
  await driver.openNewPage('about:blank');

  await completeCreateNewWalletOnboardingFlow({
    driver,
    password: WALLET_PASSWORD,
    optedIn,
    skipSRPBackup: true,
  });

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForLoadingOverlayToDisappear();

  const headerNavbar = new HeaderNavbar(driver);
  const firstAddress = await getFirstAddress(driver, headerNavbar, {
    waitForSync: false,
  });
  await lockAndWaitForLoginPage(driver);

  // Ensure backup is in IndexedDB otherwise the Extension may restart with no backup to recover from.
  await waitForBackupVault(driver);

  // use the home page to destroy the vault
  await driver.executeAsyncScript(script);

  // the previous tab we were using is now closed, so we need to tell Selenium
  // to switch back to the other page (required for Chrome)
  await driver.switchToWindow(initialWindow);

  // get a new tab ready to use (required for Firefox)
  await driver.openNewPage('about:blank');

  return firstAddress;
}

/**
 * Onboards a new wallet, then triggers database corruption.
 *
 * Flow:
 * 1. Opens a spare tab (to prevent browser from closing when extension reloads)
 * 2. Completes new wallet onboarding
 * 3. Calls onboardThenExecuteScript to get address, lock, run script, switch back
 * 4. Waits for the vault recovery page to appear
 *
 * @param driver - The WebDriver instance.
 * @param script - The script to break the DB (or simpleReloadScript when manifest flags handle it).
 * @param options - Additional options.
 * @param options.optedIn - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @returns The initial first account's address (before corruption).
 */
export async function onboardThenTriggerCorruptionFlow(
  driver: Driver,
  script: string,
  options: OnboardingMetricsFlowOptions = {},
): Promise<string> {
  const firstAddress = await onboardThenExecuteScript(driver, script, options);

  // wait for the background page to reload
  // Since reloading the background restarts the extension the UI isn't
  // available immediately. So we just keep reloading the UI until it is.
  const vaultRecoveryPage = new VaultRecoveryPage(driver);
  await vaultRecoveryPage.waitForPageAfterExtensionReload();

  return firstAddress;
}

/**
 * Onboards a new wallet, then triggers init or state sync timeout (when backup exists).
 *
 * Flow: onboard → onboardThenExecuteScript(simpleReloadScript) → wait for critical error page.
 *
 * @param driver - The WebDriver instance.
 * @param options - Additional options.
 * @param options.timeoutMs - How long to wait for the critical error page (must allow for
 * phase timeouts: init ~31s, state sync ~47s). Default 60s.
 * @returns The initial first account's address (before reload).
 */
export async function onboardThenTriggerTimeOutFlow(
  driver: Driver,
  { timeoutMs = 60_000 } = {},
): Promise<string> {
  const firstAddress = await onboardThenExecuteScript(
    driver,
    simpleReloadScript,
  );

  const criticalErrorPage = new CriticalErrorPage(driver);
  await criticalErrorPage.waitForPageAfterExtensionReload({
    timeoutMs,
    waitForLoadingLogoToDisappear: false,
  });

  // Init/state-sync timeout shows a ~15s loading spinner before the critical error
  await criticalErrorPage.checkPageIsLoaded(20000);

  return firstAddress;
}
