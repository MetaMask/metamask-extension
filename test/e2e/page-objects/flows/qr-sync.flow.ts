import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import SettingsPage from '../pages/settings/settings-page';
import AddDeviceSettingsPage from '../pages/settings/add-device-settings-page';
import { qrSyncSimulate } from '../../tests/qr-sync/qr-sync-e2e-bridge';
import {
  QR_SYNC_E2E_OTP,
  QR_SYNC_E2E_PASSWORD,
} from '../../tests/qr-sync/constants';

/**
 * Dry-run (Phase 6 spec):
 *
 * ```ts
 * import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
 * import { withFixtures } from '../../helpers';
 * import { login } from './login.flow';
 * import { buildQrSyncFixtures } from '../../tests/qr-sync/constants';
 * import { completeQrSyncHappyPath } from './qr-sync.flow';
 *
 * await withFixtures(
 *   { fixtures: buildQrSyncFixtures(), title: this.test?.fullTitle() },
 *   async ({ driver }) => {
 *     await login(driver, { password: QR_SYNC_E2E_PASSWORD });
 *     await completeQrSyncHappyPath(driver);
 *   },
 * );
 * ```
 */

/**
 * Opens Settings and navigates to the Add device tab, waiting for the QR code.
 *
 * @param driver - The WebDriver instance.
 * @returns The Add device page object.
 */
export async function navigateToAddDeviceSettings(
  driver: Driver,
): Promise<AddDeviceSettingsPage> {
  console.log('Navigating to Add device settings');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToAddDeviceSettings();

  const addDevicePage = new AddDeviceSettingsPage(driver);
  await addDevicePage.waitForQrCode();
  return addDevicePage;
}

/**
 * Completes the single-wallet QrSync happy path using the E2E mobile simulator.
 *
 * @param driver - The WebDriver instance.
 * @param options - Optional overrides for password, OTP, or wallet row selection.
 * @param options.password
 * @param options.otp
 * @param options.walletRowId
 */
export async function completeQrSyncHappyPath(
  driver: Driver,
  options?: {
    password?: string;
    otp?: string;
    walletRowId?: string;
  },
): Promise<void> {
  const password = options?.password ?? QR_SYNC_E2E_PASSWORD;
  const otp = options?.otp ?? QR_SYNC_E2E_OTP;

  const addDevicePage = await navigateToAddDeviceSettings(driver);
  await driver.delay(5_000);
  qrSyncSimulate('mobileScanned');
  await addDevicePage.waitForOtpScreen();
  await addDevicePage.enterOtp(otp);

  qrSyncSimulate('deliverSyncOffer');
  await addDevicePage.waitForPasswordScreen();
  await addDevicePage.enterPassword(password);

  await addDevicePage.waitForSyncButton();
  if (options?.walletRowId) {
    await addDevicePage.selectWalletRow(options.walletRowId);
  }
  await addDevicePage.confirmSync();

  qrSyncSimulate('deliverSyncCompleted');
  await addDevicePage.waitForSuccess();
  await addDevicePage.clickDone();
}
