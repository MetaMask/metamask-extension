import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import SettingsPage from '../../page-objects/pages/settings-page';
import ExperimentalSettings from '../../page-objects/pages/experimental-settings';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';

describe('Add snap account experimental settings', function (this: Suite) {
  it('switch "Enable Add account snap" to on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver, '0');

        // Make sure the "Add snap account" button is not visible.
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.openAddAccountModal();
        await accountListPage.check_addAccountSnapButtonNotPresent();
        await accountListPage.closeAccountModal();

        // Navigate to experimental settings and enable Add account Snap.
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await settingsPage.check_pageIsLoaded();
        await experimentalSettings.toggleAddAccountSnap();

        // Make sure the "Add account Snap" button is visible.
        await headerNavbar.openAccountMenu();
        await accountListPage.openAddAccountModal();
        await accountListPage.check_addAccountSnapButtonIsDisplayed();
      },
    );
  });
});
