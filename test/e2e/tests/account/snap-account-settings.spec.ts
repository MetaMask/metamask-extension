import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import ChooseWalletTypePage from '../../page-objects/pages/accounts/add-wallet/choose-wallet-type-page';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';
import { openAddWalletMenu } from '../../page-objects/flows/add-wallet.flow';

describe('Add snap account experimental settings', function (this: Suite) {
  it('switch "Enable Add account snap" to on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Make sure the "Add snap account" button is not visible.
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        const chooseWalletTypePage = new ChooseWalletTypePage(driver);
        await openAddWalletMenu(driver);
        await chooseWalletTypePage.checkSnapAccountOptionIsDisplayed(false);
        await chooseWalletTypePage.goBack();
        await accountListPage.closeMultichainAccountsPage();

        // Navigate to experimental settings and enable Add account Snap.
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToExperimentalSettings();

        const experimentalSettings = new ExperimentalSettings(driver);
        await experimentalSettings.checkPageIsLoaded();
        await experimentalSettings.toggleAddAccountSnap();
        await closeSettings(driver);
        // Make sure the "Add account Snap" button is visible.
        await headerNavbar.openAccountMenu();
        await openAddWalletMenu(driver);
        await chooseWalletTypePage.checkSnapAccountOptionIsDisplayed();
      },
    );
  });
});
