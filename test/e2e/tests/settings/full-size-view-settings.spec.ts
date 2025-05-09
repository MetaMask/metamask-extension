import {
  withFixtures,
  openDapp,
  WINDOW_TITLES,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Full-size View Setting', function () {
  it('opens the extension in popup view when opened from a dapp after enabling it in Advanced Settings', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.check_pageIsLoaded();
        await advancedSettingsPage.toggleFullSizeViewSetting();




        await openDapp(driver);
        const windowHandlesPreClick = await driver.waitUntilXWindowHandles(
          2,
          1000,
          10000,
        );
        await driver.delay(4000);
        await driver.clickElement('#maliciousPermit'); // Opens the extension in popup view.
        const windowHandlesPostClick = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.delay(4000);
        const [newWindowHandle] = windowHandlesPostClick.filter(
          (handleId: string) => !windowHandlesPreClick.includes(handleId),
        );

        await driver.delay(4000);
        await driver.switchToHandleAndWaitForTitleToBe(
          newWindowHandle,
          WINDOW_TITLES.Dialog,
        );
        await driver.delay(4000);
      },
    );
  });
});
