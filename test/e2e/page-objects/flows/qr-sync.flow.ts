import type {
  QrSyncSimulatorAction,
  SimulatorParams,
} from '../../helpers/qr-sync/mobile-wallet-simulator';
import { getServerMochaToBackground } from '../../background-socket/server-mocha-to-background';
import { QR_SYNC_E2E_OTP, WALLET_PASSWORD } from '../../constants';
import HeaderNavbar from '../pages/header-navbar';
import SettingsPage from '../pages/settings/settings-page';
import SyncAccountsSettingsPage from '../pages/settings/sync-accounts-settings-page';
import { Driver } from '../../webdriver/driver';

/**
 * Sends a mobile-wallet simulator command to the extension background.
 *
 * @param action - The simulator action to run.
 * @param params - Optional simulator parameters.
 */
export function qrSyncSimulate(
  action: QrSyncSimulatorAction,
  params?: SimulatorParams,
): void {
  const mock = getServerMochaToBackground();
  mock.send({
    command: 'qrSyncSimulate',
    action,
    params,
  });
}

/**
 * Opens Sync accounts from the Settings page and waits for the QR code.
 *
 * @param driver - The WebDriver instance.
 * @returns The Sync accounts page object.
 */
export async function openSyncAccountsFromSettings(
  driver: Driver,
): Promise<SyncAccountsSettingsPage> {
  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToSyncAccountsSettings();

  const syncAccountsPage = new SyncAccountsSettingsPage(driver);
  await syncAccountsPage.checkPageIsLoaded();
  await syncAccountsPage.waitForQrCode();
  return syncAccountsPage;
}

/**
 * Opens Settings and navigates to Sync accounts, waiting for the QR code.
 *
 * @param driver - The WebDriver instance.
 * @returns The Sync accounts page object.
 */
export async function navigateToSyncAccountsSettings(
  driver: Driver,
): Promise<SyncAccountsSettingsPage> {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();

  return openSyncAccountsFromSettings(driver);
}

/**
 * Completes the QrSync flow from an active sync session screen.
 *
 * @param options
 * @param options.syncAccountsPage - The Sync accounts page object.
 * @param options.driver - The WebDriver instance.
 * @param options.expectedWalletCount - Expected synced entropy/HD wallet count.
 * @param options.expectedImportedAccountCount - Expected synced imported account count.
 */
export async function completeQrSyncFromSyncPage({
  syncAccountsPage,
  driver,
  expectedWalletCount,
  expectedImportedAccountCount,
}: {
  syncAccountsPage: SyncAccountsSettingsPage;
  driver: Driver;
  expectedWalletCount: number;
  expectedImportedAccountCount: number;
}): Promise<void> {
  qrSyncSimulate('mobileScanned');
  await syncAccountsPage.waitForOtpScreen();
  await syncAccountsPage.enterOtp(QR_SYNC_E2E_OTP);
  await syncAccountsPage.waitForLoadingStep();

  qrSyncSimulate('deliverSyncOffer');
  await syncAccountsPage.waitForPasswordScreen();
  await syncAccountsPage.enterPassword(WALLET_PASSWORD);

  await syncAccountsPage.waitForSyncButton();
  await syncAccountsPage.confirmSync();
  await syncAccountsPage.waitForLoadingStep();

  qrSyncSimulate('deliverSyncCompleted');
  await syncAccountsPage.assertSuccessSyncedCounts(
    expectedWalletCount,
    expectedImportedAccountCount,
  );
}

/**
 * Runs the QrSync flow from Settings navigation through success.
 *
 * @param options
 * @param options.driver - The WebDriver instance.
 * @param options.expectedWalletCount - Expected synced entropy/HD wallet count.
 * @param options.expectedImportedAccountCount - Expected synced imported account count.
 */
export async function completeQrSyncFlow({
  driver,
  expectedWalletCount,
  expectedImportedAccountCount,
}: {
  driver: Driver;
  expectedWalletCount: number;
  expectedImportedAccountCount: number;
}): Promise<void> {
  const syncAccountsPage = await navigateToSyncAccountsSettings(driver);
  await completeQrSyncFromSyncPage({
    syncAccountsPage,
    driver,
    expectedWalletCount,
    expectedImportedAccountCount,
  });
}
