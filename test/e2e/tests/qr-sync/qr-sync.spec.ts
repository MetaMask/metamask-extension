import type {
  QrSyncSimulatorAction,
  SimulatorParams,
} from '../../helpers/qr-sync/mobile-wallet-simulator';
import { getServerMochaToBackground } from '../../background-socket/server-mocha-to-background';
import { WALLET_PASSWORD, QR_SYNC_E2E_OTP } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import SyncAccountsSettingsPage from '../../page-objects/pages/settings/sync-accounts-settings-page';
import { Driver } from '../../webdriver/driver';

function qrSyncSimulate(
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
 * Opens Settings and navigates to Sync accounts, waiting for the QR code.
 *
 * @param driver - The WebDriver instance.
 * @returns The Sync accounts page object.
 */
async function navigateToSyncAccountsSettings(
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
  it('syncs a single HD wallet to mobile', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { password: WALLET_PASSWORD });

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        qrSyncSimulate('mobileScanned');
        await syncAccountsPage.waitForOtpScreen();
        await syncAccountsPage.enterOtp(QR_SYNC_E2E_OTP);
        await syncAccountsPage.waitForLoadingStep();

        await driver.delay(500); // slight delay to simulate the sync-offer from mobile

        qrSyncSimulate('deliverSyncOffer');
        await syncAccountsPage.waitForPasswordScreen();
        await syncAccountsPage.enterPassword(WALLET_PASSWORD);

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
