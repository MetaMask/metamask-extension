import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

describe('Auto-Lock Timer', function () {
  it('should automatically lock the wallet once the idle time has elapsed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToSecurityAndPasswordSettings();

        // Set auto lock timer to the shortest V2 option: 15 seconds.
        await settingsPage.goToAutoLockSettings();
        await settingsPage.waitForAutoLockOptionsList();
        await settingsPage.selectQuarterMinuteAutoLockOption();

        // Necessary wait for the 15-second auto lockout to trigger.
        await driver.delay(16000);

        // Verify the wallet is locked
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
      },
    );
  });
});
