import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { login } from '../../page-objects/flows/login.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { withFixtures } from '../../helpers';

describe('Settings', function () {
  it('checks jazzicon and blockies icons', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Initialize page objects
        const settingsPage = new SettingsPage(driver);
        const preferencesAndDisplaySettings = new PreferencesAndDisplaySettings(
          driver,
        );
        const headerNavbar = new HeaderNavbar(driver);

        // Unlock wallet and navigate to settings
        await login(driver);
        await headerNavbar.openSettingsPage();
        await settingsPage.checkPageIsLoaded();

        // Verify identicon options
        await preferencesAndDisplaySettings.checkIdenticonOptionsAreDisplayed();
        await preferencesAndDisplaySettings.checkIdenticonIsActive('maskicon');
      },
    );
  });
});
