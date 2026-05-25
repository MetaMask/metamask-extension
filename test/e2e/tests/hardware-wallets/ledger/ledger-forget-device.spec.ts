import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withSpeculosFixtures } from '../../../speculos/with-speculos-fixtures';
import HomePage from '../../../page-objects/pages/home/homepage';
import { login } from '../../../page-objects/flows/login.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';

describe('Ledger Hardware @speculos', function (this: Suite) {
  this.timeout(180000);

  it('forgets device and checks if it is removed from the list', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().withSpeculosLedgerAccount().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.clickConnectLedgerButton();

        const selectLedgerAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectLedgerAccountPage.checkPageIsLoaded();

        await selectLedgerAccountPage.clickForgetDeviceButton();

        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.clickCloseButton();

        await accountListPage.closeChooseWalletTypePage();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          'Ledger 1',
        );
      },
    );
  });
});
