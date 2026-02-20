import {
  DAPP_ONE_ADDRESS,
  DAPP_ONE_URL,
  DAPP_HOST_ADDRESS,
  DEFAULT_FIXTURE_ACCOUNT,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/add-network-confirmations';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import Homepage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Dapp interactions', function () {
  it('should trigger the add chain confirmation despite MetaMask being locked', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
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
        await testDapp.checkPageIsLoaded();

        // Trigger Notification
        await testDapp.clickAddNetworkButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        await new AddNetworkConfirmation(driver).checkPageIsLoaded(
          'Localhost 8546',
        );
      },
    );
  });

  it('should connect a second Dapp despite MetaMask being locked', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 2 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        // Connect to 2nd dapp => DAPP_ONE
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: DAPP_ONE_URL });
        await testDapp.checkPageIsLoaded();
        await testDapp.clickConnectAccountButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);

        // Login to homepage
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.navigate();

        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();

        // Assert Connection
        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();
        await permissionListPage.checkConnectedToSite(DAPP_HOST_ADDRESS);
        await permissionListPage.checkConnectedToSite(DAPP_ONE_ADDRESS);
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
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        // to avoid a race condition where some authentication requests are triggered once the wallet is locked
        ignoredConsoleErrors: ['unable to proceed, wallet is locked'],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // Lock the wallet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homepage = new Homepage(driver);
        await homepage.headerNavbar.lockMetaMask();

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        // Attempt interaction with DApp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickCreateToken();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await loginPage.checkPageIsLoaded();
        console.log('Prompted to unlock the wallet');
        await loginPage.loginToHomepage('123456');
        await loginPage.checkIncorrectPasswordMessageIsDisplayed();
        await loginPage.loginToHomepage();
      },
    );
  });
});
