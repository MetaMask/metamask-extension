import { DEFAULT_FIXTURE_ACCOUNT, DAPP_HOST_ADDRESS } from '../../constants';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Permissions Page', function () {
  it('should show connected site permissions when a single dapp is connected', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.connectAccount(DEFAULT_FIXTURE_ACCOUNT);

        // switch to extension window and check the site permissions
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homepage = new Homepage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed();
        await homepage.headerNavbar.openPermissionsPage();

        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.check_connectedToSite(DAPP_HOST_ADDRESS);
      },
    );
  });

  it('should show all permissions listed when experimental settings toggle is off', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();

        // go to experimental settings page and toggle request queue
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.check_pageIsLoaded();
        await experimentalSettings.toggleRequestQueue();
        await settingsPage.closeSettingsPage();

        // go to homepage and check site permissions
        await new Homepage(driver).check_pageIsLoaded();
        await headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.check_connectedToSite(DAPP_HOST_ADDRESS);
      },
    );
  });
});
