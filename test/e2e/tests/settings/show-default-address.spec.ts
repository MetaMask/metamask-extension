import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Show default address', function (this: Suite) {
  it('displays Show default address section on General settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Navigate to settings and check "show default address" section is displayed
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();
        await generalSettings.checkShowDefaultAddressSectionIsDisplayed();
      },
    );
  });

  it('does not display default address in header on homepage by default', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Check on home page that default address is not present
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkDefaultAddressIsNotDisplayed();
      },
    );
  });

  it('displays default address in header on homepage when toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Navigate to settings and toggle on "show default address" feature
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();
        await generalSettings.toggleShowDefaultAddress();
        await new SettingsPage(driver).closeSettingsPage();

        // Check on home page that default address is present
        await homePage.checkPageIsLoaded();
        await homePage.checkDefaultAddressIsDisplayed();
      },
    );
  });
});
