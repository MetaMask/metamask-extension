import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Show default address', function (this: Suite) {
  it('displays Show default address section on General settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Navigate to settings and check "show default address" section is displayed
        await new HomePage(driver).headerNavbar.openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();
        await generalSettings.checkShowDefaultAddressSectionIsDisplayed();
      },
    );
  });

  it('does not display default address in header on homepage by default', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Check on home page that default address is not present
        await new HomePage(driver).checkPageIsLoaded();
        await driver.assertElementNotPresent(
          '[data-testid="default-address-container"]',
        );
      },
    );
  });

  it('displays default address in header on homepage when toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Navigate to settings and toggle on "show default address" feature
        await new HomePage(driver).headerNavbar.openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();
        await generalSettings.toggleShowDefaultAddress();
        await new SettingsPage(driver).closeSettingsPage();

        // Check on home page that default address is present
        await new HomePage(driver).checkPageIsLoaded();
        await driver.waitForSelector(
          '[data-testid="default-address-container"]',
        );
      },
    );
  });
});
