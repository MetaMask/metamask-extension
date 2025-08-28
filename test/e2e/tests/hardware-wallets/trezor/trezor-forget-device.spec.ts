import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import { Ganache } from '../../../seeder/ganache';
import FixtureBuilder from '../../../fixture-builder';
import { withFixtures } from '../../../helpers';


import HomePage from '../../../page-objects/pages/home/homepage';

import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
describe('Trezor Hardware', function (this: Suite) {
  it('forgets device and checks if it is removed from the list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withTrezorAccount().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.openConnectTrezorPage();

        const selectTrezorAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectTrezorAccountPage.checkPageIsLoaded();

        await selectTrezorAccountPage.clickForgetDeviceButton();

        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.clickCloseButton();

        await homePage.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          'Trezor 1',
        );
      },
    );
  });
});
