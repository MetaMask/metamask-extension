// eslint-disable-next-line @typescript-eslint/no-shadow -- @playwright/test exports `test` as a callable namespace; the global `test` is Mocha's
import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';

pwTest.describe('Auto-Lock Timer', () => {
  pwTest(
    'automatically locks the wallet once the idle time has elapsed',
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
          await login(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToSecurityAndPasswordSettings();

          await settingsPage.goToAutoLockSettings();
          await settingsPage.waitForAutoLockOptionsList();
          await settingsPage.selectQuarterMinuteAutoLockOption();

          await driver.delay(16500);

          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();
        },
      );
    },
  );
});
