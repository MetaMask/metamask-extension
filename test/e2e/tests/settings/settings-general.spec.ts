import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { withFixtures } from '../../helpers';

describe('Settings', function () {
  it('checks jazzicon and blockies icons', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Initialize page objects
        const settingsPage = new SettingsPage(driver);
        const generalSettings = new GeneralSettings(driver);
        const headerNavbar = new HeaderNavbar(driver);

        // Unlock wallet and navigate to settings
        await loginWithBalanceValidation(driver);
        await headerNavbar.openSettingsPage();
        await settingsPage.checkPageIsLoaded();

        // Verify identicon options
        await generalSettings.checkIdenticonOptionsAreDisplayed();
        await generalSettings.checkIdenticonIsActive('jazzicon');
      },
    );
  });
});
