import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Lattice hardware wallet', function (this: Suite) {
  it('lattice page rendering validation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Choose connect hardware wallet from the account menu
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.openConnectLatticePage();

        const allWindows = await driver.waitUntilXWindowHandles(2);
        assert.equal(allWindows.length, isManifestV3 ? 3 : 2);
      },
    );
  });
});
