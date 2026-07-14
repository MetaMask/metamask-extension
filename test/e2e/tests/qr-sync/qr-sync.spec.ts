import type {
  QrSyncSimulatorAction,
  SimulatorParams,
} from '../../helpers/qr-sync/mobile-wallet-simulator';
import { getServerMochaToBackground } from '../../background-socket/server-mocha-to-background';
import { WALLET_PASSWORD, QR_SYNC_E2E_OTP } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import SyncAccountsSettingsPage from '../../page-objects/pages/settings/sync-accounts-settings-page';
import { Driver } from '../../webdriver/driver';

const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

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

/**
 * Imports a private-key account through the account list UI.
 *
 * @param driver - The WebDriver instance.
 * @param options - Optional flow configuration.
 * @param options.accountListTimeout - Timeout while waiting for the account list.
 */
async function importPrivateKeyAccount(
  driver: Driver,
  options: { accountListTimeout?: number } = {},
): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded(options.accountListTimeout);
  await accountListPage.addNewImportedAccount(TEST_PRIVATE_KEY);
  await accountListPage.closeMultichainAccountsPage();
}

/**
 * Runs the QrSync flow from mobile scan through success.
 *
 * @param driver - The WebDriver instance.
 * @param expectedWalletCount - Expected synced entropy/HD wallet count.
 * @param expectedImportedAccountCount - Expected synced imported account count.
 */
async function completeQrSyncFlow(
  driver: Driver,
  expectedWalletCount: number,
  expectedImportedAccountCount: number,
): Promise<void> {
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
  await syncAccountsPage.assertSuccessSyncedCounts(
    expectedWalletCount,
    expectedImportedAccountCount,
  );
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
        await completeQrSyncFlow(driver, 1, 0);
      },
    );
  });

  it('syncs one HD wallet and one imported account to mobile', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { password: WALLET_PASSWORD });
        await importPrivateKeyAccount(driver);
        await completeQrSyncFlow(driver, 1, 1);
      },
    );
  });

  it('syncs two HD wallets and one imported account to mobile', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerMultiSRP()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          password: WALLET_PASSWORD,
          validateBalance: false,
        });
        await importPrivateKeyAccount(driver, { accountListTimeout: 30000 });
        await completeQrSyncFlow(driver, 2, 1);
      },
    );
  });
});
