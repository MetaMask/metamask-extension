import { QR_SYNC_TIMEOUT_MS_E2E } from '../../../../shared/constants/qr-sync';
import type {
  QrSyncSimulatorAction,
  SimulatorParams,
} from '../../helpers/qr-sync/mobile-wallet-simulator';
import { getServerMochaToBackground } from '../../background-socket/server-mocha-to-background';
import { QR_SYNC_E2E_OTP, WALLET_PASSWORD } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import SyncAccountsSettingsPage from '../../page-objects/pages/settings/sync-accounts-settings-page';
import { Driver } from '../../webdriver/driver';

const TIMEOUT_ASSERTION_BUFFER_MS = 1_500;

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
 * Opens Sync accounts from the Settings page and waits for the QR code.
 *
 * @param driver - The WebDriver instance.
 * @returns The Sync accounts page object.
 */
async function openSyncAccountsFromSettings(
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
async function navigateToSyncAccountsSettings(
  driver: Driver,
): Promise<SyncAccountsSettingsPage> {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();

  return openSyncAccountsFromSettings(driver);
}

/**
 * Completes the QrSync flow from an active sync session screen.
 *
 * @param syncAccountsPage - The Sync accounts page object.
 * @param driver - The WebDriver instance.
 * @param expectedWalletCount - Expected synced entropy/HD wallet count.
 * @param expectedImportedAccountCount - Expected synced imported account count.
 */
async function completeQrSyncFromSyncPage(
  syncAccountsPage: SyncAccountsSettingsPage,
  driver: Driver,
  expectedWalletCount: number,
  expectedImportedAccountCount: number,
): Promise<void> {
  qrSyncSimulate('mobileScanned');
  await syncAccountsPage.waitForOtpScreen();
  await syncAccountsPage.enterOtp(QR_SYNC_E2E_OTP);
  await syncAccountsPage.waitForLoadingStep();

  await driver.delay(500);

  qrSyncSimulate('deliverSyncOffer');
  await syncAccountsPage.waitForPasswordScreen();
  await syncAccountsPage.enterPassword(WALLET_PASSWORD);

  await syncAccountsPage.waitForSyncButton();
  await syncAccountsPage.confirmSync();
  await syncAccountsPage.waitForLoadingStep();

  await driver.delay(500);

  qrSyncSimulate('deliverSyncCompleted');
  await syncAccountsPage.assertSuccessSyncedCounts(
    expectedWalletCount,
    expectedImportedAccountCount,
  );
}

describe('QR Sync Phases', function () {
  this.timeout(60_000);

  it('should cancel the QR sync session and start a new one', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { password: WALLET_PASSWORD });

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);
        await syncAccountsPage.clickBack();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();

        const restartedSyncAccountsPage =
          await openSyncAccountsFromSettings(driver);
        await completeQrSyncFromSyncPage(
          restartedSyncAccountsPage,
          driver,
          1,
          0,
        );
      },
    );
  });

  it('should display the QR sync sessiontimeout error when QR Code is not scanned within the timeout', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { password: WALLET_PASSWORD });

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        await driver.delay(
          QR_SYNC_TIMEOUT_MS_E2E.MWP_SESSION_TIMEOUT +
            TIMEOUT_ASSERTION_BUFFER_MS,
        );
        await syncAccountsPage.waitForQrExpiredMessage();
      },
    );
  });

  it('should display the QR sync sessiontimeout error when OTP is not entered within the timeout', async function () {
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

        await driver.delay(
          QR_SYNC_TIMEOUT_MS_E2E.MWP_SESSION_TIMEOUT +
            TIMEOUT_ASSERTION_BUFFER_MS,
        );
        await syncAccountsPage.waitForOtpExpired();
      },
    );
  });

  it('should display the SYNC_OFFER_TIMED_OUT error when Sync offer is not accepted within the timeout', async function () {
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

        await driver.delay(
          QR_SYNC_TIMEOUT_MS_E2E.SYNC_OFFER_TIMEOUT +
            TIMEOUT_ASSERTION_BUFFER_MS,
        );
        await syncAccountsPage.waitForSessionExpiredError();
      },
    );
  });

  it('should restart the Qr Sync session from the QR Expired screen', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { password: WALLET_PASSWORD });

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        await driver.delay(
          QR_SYNC_TIMEOUT_MS_E2E.MWP_SESSION_TIMEOUT +
            TIMEOUT_ASSERTION_BUFFER_MS,
        );
        await syncAccountsPage.waitForQrExpiredMessage();

        await syncAccountsPage.clickGenerateNewQrCode();
        await syncAccountsPage.waitForQrCode();

        await completeQrSyncFromSyncPage(syncAccountsPage, driver, 1, 0);
      },
    );
  });

  it('should restart the Qr Sync session from the OTP Timeout screen', async function () {
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

        await driver.delay(
          QR_SYNC_TIMEOUT_MS_E2E.MWP_SESSION_TIMEOUT +
            TIMEOUT_ASSERTION_BUFFER_MS,
        );
        await syncAccountsPage.waitForOtpExpired();

        await syncAccountsPage.clickStartWithNewQrCode();
        await syncAccountsPage.waitForQrCode();

        await completeQrSyncFromSyncPage(syncAccountsPage, driver, 1, 0);
      },
    );
  });
});
