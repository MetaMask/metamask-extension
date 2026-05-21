import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosFixtures,
  withSpeculosAutoApprove,
} from '../../../speculos/with-speculos-fixtures';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import { login } from '../../../page-objects/flows/login.flow';

describe('Ledger Hardware - Speculos Integration @speculos', function () {
  this.timeout(120000);

  it('connects to a Ledger device with manual approval', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver, automation }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectPage = new ConnectHardwareWalletPage(driver);
        await connectPage.checkPageIsLoaded();
        await connectPage.clickConnectLedgerButton();
        await connectPage.clickContinueButton(30000);

        const selectPage = new SelectHardwareWalletAccountPage(driver);
        await selectPage.checkPageIsLoaded();

        await automation.approve();
        await selectPage.unlockAccount(1);

        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountDisplayedInAccountList(
          'Ledger Account 1',
        );
      },
    );
  });

  it('connects and unlocks a Ledger account with auto-approval', async function () {
    await withSpeculosAutoApprove(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectPage = new ConnectHardwareWalletPage(driver);
        await connectPage.checkPageIsLoaded();
        await connectPage.clickConnectLedgerButton();
        await connectPage.clickContinueButton(30000);

        const selectPage = new SelectHardwareWalletAccountPage(driver);
        await selectPage.checkPageIsLoaded();
        await selectPage.unlockAccount(1);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
