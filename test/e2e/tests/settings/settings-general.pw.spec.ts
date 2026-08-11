import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { login } from '../../page-objects/flows/login.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { withFixtures } from '../../helpers';

pwTest.describe('Settings', () => {
  pwTest(
    'checks jazzicon and blockies icons',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          // Initialize page objects
          const settingsPage = new SettingsPage(driver);
          const preferencesAndDisplaySettings =
            new PreferencesAndDisplaySettings(driver);
          const headerNavbar = new HeaderNavbar(driver);

          // Unlock wallet and navigate to settings
          await login(driver);
          await headerNavbar.openSettingsPage();
          await settingsPage.checkPageIsLoaded();

          // Verify identicon options
          await preferencesAndDisplaySettings.checkIdenticonOptionsAreDisplayed();
          await preferencesAndDisplaySettings.checkIdenticonIsActive(
            'maskicon',
          );
        },
      );
    },
  );
});
