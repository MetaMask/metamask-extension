import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import PreferencesAndDisplaySettings from '../../page-objects/pages/settings/preferences-and-display-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

const SHOW_DEFAULT_ADDRESS_FLAG = {
  remoteFeatureFlags: { extensionUxDefaultAddressVersioned: true },
};

describe('Show default address', function (this: Suite) {
  it('displays Show default address section on General settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: SHOW_DEFAULT_ADDRESS_FLAG,
      },
      async ({ driver }) => {
        await login(driver);

        // Navigate to settings and check "show default address" section is displayed
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.openSettingsPage();
        const preferencesAndDisplaySettings = new PreferencesAndDisplaySettings(
          driver,
        );
        await preferencesAndDisplaySettings.checkPageIsLoaded();
        await preferencesAndDisplaySettings.checkShowDefaultAddressSectionIsDisplayed();
      },
    );
  });

  it('displays default address in header on homepage by default', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: SHOW_DEFAULT_ADDRESS_FLAG,
      },
      async ({ driver }) => {
        await login(driver);

        // Check on home page that default address is present by default
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkDefaultAddressIsDisplayed();
      },
    );
  });

  it('hides default address in header on homepage when toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: SHOW_DEFAULT_ADDRESS_FLAG,
      },
      async ({ driver }) => {
        await login(driver);

        // Navigate to settings and toggle off "show default address" feature
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.openSettingsPage();
        const preferencesAndDisplaySettings = new PreferencesAndDisplaySettings(
          driver,
        );
        await preferencesAndDisplaySettings.checkPageIsLoaded();
        await preferencesAndDisplaySettings.toggleShowDefaultAddress();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.clickBackButton();

        // Check on home page that default address is not present
        await homePage.checkPageIsLoaded();
        await homePage.checkDefaultAddressIsNotDisplayed();
      },
    );
  });
});
