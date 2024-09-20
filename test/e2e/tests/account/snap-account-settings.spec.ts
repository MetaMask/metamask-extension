import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import SettingsPage from '../../page-objects/pages/settings-page';
import ExperimentalSettings from '../../page-objects/pages/experimental-settings';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/homepage';

describe('Add snap account experimental settings', function (this: Suite) {
  it('switch "Enable Add account snap" to on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // Make sure the "Add snap account" button is not visible.
        const headerNavbar = new HeaderNavbar(driver);
        const homePage = new HomePage(driver);
        await homePage.openAccountMenu();
        await homePage.openAddAccountModal();
        await homePage.assertAddAccountSnapButtonNotPresent();
        await homePage.closeModal();

        // Navigate to experimental settings and enable Add account Snap.
        const settingsPage = new SettingsPage(driver);
        await settingsPage.goToExperimentalSettings();
        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.toggleAddAccountSnap();

        // Make sure the "Add account Snap" button is visible.
        await homePage.openAccountMenu();
        await homePage.openAddAccountModal();
        await homePage.assertAddAccountSnapButtonPresent();
      },
    );
  });
});
