import { unlockWallet, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { Driver } from '../../webdriver/driver';

describe('Settings', function () {
  it('checks jazzicon and blockies icons', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Initialize page objects
        const settingsPage = new SettingsPage(driver);
        const generalSettings = new GeneralSettings(driver);
        const headerNavbar = new HeaderNavbar(driver);

        // Unlock wallet and navigate to settings
        await unlockWallet(driver);
        await headerNavbar.openSettingsPage();
        await settingsPage.check_pageIsLoaded();

        // Verify identicon options
        await generalSettings.verifyIdenticonOptions();
      },
    );
  });
});
