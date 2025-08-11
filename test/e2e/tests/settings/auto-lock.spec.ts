import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Auto-Lock Timer', function () {
  it('should automatically lock the wallet once the idle time has elapsed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();

        // Set Auto Lock Timer
        const sixSecsInMins = '0.1';
        await advancedSettingsPage.fillAutoLockoutTime(
          '10081',
          'Lock time must be a number between 0 and 10080',
        );
        await advancedSettingsPage.fillAutoLockoutTime(sixSecsInMins);
        await advancedSettingsPage.confirmAutoLockout();

        // Necessary wait for the auto lockout to trigger
        await driver.delay(6000);

        // Verify the wallet is locked
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
      },
    );
  });
});
