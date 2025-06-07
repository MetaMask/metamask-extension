import { withFixtures, WINDOW_TITLES } from '../../helpers';
import {
  DAPP_ONE_ADDRESS,
  DAPP_ONE_URL,
  DAPP_HOST_ADDRESS,
  DEFAULT_FIXTURE_ACCOUNT,
} from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/redesign/add-network-confirmations';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import Homepage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Dapp interactions', function () {
  it('should trigger the add chain confirmation despite MetaMask being locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port: 8546,
              chainId: 1338,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        // Trigger Notification
        await testDapp.clickAddNetworkButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage();
        await new AddNetworkConfirmation(driver).check_pageIsLoaded(
          'Localhost 8546',
        );
      },
    );
  });

  it('should connect a second Dapp despite MetaMask being locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        // Connect to 2nd dapp => DAPP_ONE
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_ONE_URL });
        await testDapp.check_pageIsLoaded();
        await testDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage();
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.confirmConnect();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_connectedAccounts(DEFAULT_FIXTURE_ACCOUNT);

        // Login to homepage
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage();
        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();

        // Assert Connection
        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.check_connectedToSite(DAPP_HOST_ADDRESS);
        await permissionListPage.check_connectedToSite(DAPP_ONE_ADDRESS);
      },
    );
  });

  it('should lock the wallet while connected to a dapp, prompt for unlock successfully unlock', async function () {
    // Check if the browser is Firefox and skip the test if true
    // Due to this issue - https://github.com/MetaMask/metamask-extension/issues/32071
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // Lock the wallet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homepage = new Homepage(driver);
        await homepage.headerNavbar.lockMetaMask();

        // Attempt interaction with DApp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.findAndClickCreateToken();
        await testDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        console.log('Prompted to unlock the wallet');
        await loginPage.loginToHomepage('123456');
        await loginPage.check_incorrectPasswordMessageIsDisplayed();
        await loginPage.loginToHomepage();
      },
    );
  });
});
