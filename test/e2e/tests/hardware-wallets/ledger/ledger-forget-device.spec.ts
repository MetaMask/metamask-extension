import { Suite } from 'mocha';
import { Browser } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosAutoApprove,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import HomePage from '../../../page-objects/pages/home/homepage';
import { Driver } from '../../../webdriver/driver';

import { login } from '../../../page-objects/flows/login.flow';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

describe('Ledger Hardware @speculos', function (this: Suite) {
  this.timeout(120000);

  let shared: SharedSpeculosContext;

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  it('forgets device and checks if it is removed from the list', async function () {
    await withSpeculosAutoApprove(
      {
        fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
      },
      async ({ driver }: { driver: Driver }) => {
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

        if (isFirefox) {
          await connectHardwareWalletPage.checkFirefoxNotSupportedIsDisplayed();
          return;
        }

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
          'Ledger Account 1',
        );
      },
    );
  });
});
