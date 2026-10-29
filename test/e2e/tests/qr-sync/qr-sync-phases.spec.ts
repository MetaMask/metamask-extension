import { QR_SYNC_TIMEOUT_MS_E2E } from '../../../../shared/constants/qr-sync';
import { QR_SYNC_E2E_OTP } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import {
  completeQrSyncFromSyncPage,
  navigateToSyncAccountsSettings,
  openSyncAccountsFromSettings,
  qrSyncSimulate,
} from '../../page-objects/flows/qr-sync.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { Driver } from '../../webdriver/driver';

// Extra time after the configured QR sync timeout so the controller timer can
// fire and the UI can transition to the expired/error screen before we assert.
const TIMEOUT_ASSERTION_BUFFER_MS = 1_500;

describe('QR Sync Phases', function () {
  it('should cancel the QR sync session and start a new one', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);
        await syncAccountsPage.clickBack();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();

        const restartedSyncAccountsPage =
          await openSyncAccountsFromSettings(driver);
        await completeQrSyncFromSyncPage({
          syncAccountsPage: restartedSyncAccountsPage,
          driver,
          expectedWalletCount: 1,
          expectedImportedAccountCount: 0,
        });
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
        await login(driver);

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        // Do not scan the QR code. Wait out the MWP session timeout so the QR
        // expired screen is shown.
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
        await login(driver);

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        qrSyncSimulate('mobileScanned');
        await syncAccountsPage.waitForOtpScreen();

        // Do not enter the OTP. Wait out the MWP session timeout so the OTP
        // expired screen is shown.
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
        await login(driver);

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        qrSyncSimulate('mobileScanned');
        await syncAccountsPage.waitForOtpScreen();
        await syncAccountsPage.enterOtp(QR_SYNC_E2E_OTP);
        await syncAccountsPage.waitForLoadingStep();

        // Do not accept the mobile sync offer. Wait out the sync-offer timeout
        // so the session-expired error is shown.
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
        await login(driver);

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        // Do not scan the QR code. Wait out the MWP session timeout so the QR
        // expired screen is shown.
        await driver.delay(
          QR_SYNC_TIMEOUT_MS_E2E.MWP_SESSION_TIMEOUT +
            TIMEOUT_ASSERTION_BUFFER_MS,
        );
        await syncAccountsPage.waitForQrExpiredMessage();

        await syncAccountsPage.clickGenerateNewQrCode();
        await syncAccountsPage.waitForQrCode();

        await completeQrSyncFromSyncPage({
          syncAccountsPage,
          driver,
          expectedWalletCount: 1,
          expectedImportedAccountCount: 0,
        });
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
        await login(driver);

        const syncAccountsPage = await navigateToSyncAccountsSettings(driver);

        qrSyncSimulate('mobileScanned');
        await syncAccountsPage.waitForOtpScreen();

        // Do not enter the OTP. Wait out the MWP session timeout so we can
        // restart from the OTP expired screen.
        await driver.delay(
          QR_SYNC_TIMEOUT_MS_E2E.MWP_SESSION_TIMEOUT +
            TIMEOUT_ASSERTION_BUFFER_MS,
        );
        await syncAccountsPage.waitForOtpExpired();

        await syncAccountsPage.clickStartWithNewQrCode();
        await syncAccountsPage.waitForQrCode();

        await completeQrSyncFromSyncPage({
          syncAccountsPage,
          driver,
          expectedWalletCount: 1,
          expectedImportedAccountCount: 0,
        });
      },
    );
  });
});
