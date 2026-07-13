import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import {
  buildQrSyncFixtures,
  QR_SYNC_E2E_OTP,
  QR_SYNC_E2E_PASSWORD,
} from './constants';
import { qrSyncSimulate } from './qr-sync-e2e-bridge';
import SettingsPage from 'test/e2e/page-objects/pages/settings/settings-page';
import SyncAccountsSettingsPage from 'test/e2e/page-objects/pages/settings/sync-accounts-settings-page';
import HeaderNavbar from 'test/e2e/page-objects/pages/header-navbar';

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

  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToSyncAccountsSettings();

  const syncAccountsPage = new SyncAccountsSettingsPage(driver);
  await syncAccountsPage.checkPageIsLoaded();
  await syncAccountsPage.waitForQrCode();
  return syncAccountsPage;
}

describe('QrSync', function () {
  this.timeout(120_000);

  it('syncs a single HD wallet to mobile (happy path)', async function () {
    await withFixtures(
      {
        fixtures: buildQrSyncFixtures(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.delay(10_000);
        await login(driver, { password: QR_SYNC_E2E_PASSWORD });

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        qrSyncSimulate('mobileScanned');
        await syncAccountsPage.waitForOtpScreen();
        await syncAccountsPage.enterOtp(QR_SYNC_E2E_OTP);
        await syncAccountsPage.waitForLoadingStep();

        await driver.delay(500); // slight delay to simulate the sync-offer from mobile

        qrSyncSimulate('deliverSyncOffer');
        await syncAccountsPage.waitForPasswordScreen();
        await syncAccountsPage.enterPassword(QR_SYNC_E2E_PASSWORD);

        await syncAccountsPage.waitForSyncButton();
        await syncAccountsPage.confirmSync();
        await syncAccountsPage.waitForLoadingStep();

        await driver.delay(500); // slight delay to simulate the sync-completed from mobile

        qrSyncSimulate('deliverSyncCompleted');
        await syncAccountsPage.waitForSuccess();
      },
    );
  });
});
