import { WALLET_PASSWORD } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { completeQrSyncFlow } from '../../page-objects/flows/qr-sync.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { Driver } from '../../webdriver/driver';

const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

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
