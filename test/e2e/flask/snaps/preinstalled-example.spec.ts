import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PreinstalledExampleSettings from '../../page-objects/pages/settings/preinstalled-example-settings';
import { strict as assert } from 'assert';
import HomePage from '../../page-objects/pages/home/homepage';
import { TestSnaps } from '../../page-objects/pages/test-snaps';
import SnapInstall from '../../page-objects/pages/dialog/snap-install';

describe('Pre-install example', function () {
  it('can display the Snap settings page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const preInstalledExample = new PreinstalledExampleSettings(driver);
        await navigateToPreInstalledExample(driver);

        await preInstalledExample.clickToggleButtonOn();
        await preInstalledExample.selectRadioOption('Option 2');
        await preInstalledExample.selectDropdownOption('Option 2')
        await preInstalledExample.check_isToggleOn();
        assert.equal(await preInstalledExample.check_selectedRadioOption('Option 2'), true);
        await preInstalledExample.check_selectedDropdownOption('Option 2');

        // Navigate to `test-snaps` page, click connect Preinstalled button, connect and approve
        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);
        await testSnaps.openPage();
        await testSnaps.scrollAndClickButton('connectPreinstalledButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.clickConfirmButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('getSettingsStateButton');
        const jsonTextValidation = '"setting1": true';
        await testSnaps.check_messageResultSpan('rpcResultSpan',jsonTextValidation);
      }
  );
  });
});

async function navigateToPreInstalledExample(driver: Driver) {
  const headerNavbar = new HeaderNavbar(driver);
  const settingsPage = new SettingsPage(driver);
  const preInstalledExample = new PreinstalledExampleSettings(driver);

  await headerNavbar.openSettingsPage();
  await headerNavbar.check_pageIsLoaded();

  await settingsPage.goToPreInstalledExample();
  await preInstalledExample.check_pageIsLoaded();
}