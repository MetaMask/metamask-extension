import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PreinstalledExampleSettings from '../../page-objects/pages/settings/preinstalled-example-settings';
import { TestSnaps } from '../../page-objects/pages/test-snaps';

describe('Preinstalled example Snap', function () {
  it('can display the Snap settings page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const preInstalledExample = new PreinstalledExampleSettings(driver);
        await navigateToPreInstalledExample(driver);

        await preInstalledExample.clickToggleButtonOn();
        await preInstalledExample.selectRadioOption('Option 2');
        await preInstalledExample.selectDropdownOption('Option 2');
        await preInstalledExample.check_isToggleOn();
        assert.equal(
          await preInstalledExample.check_selectedRadioOption('Option 2'),
          true,
        );
        await preInstalledExample.check_selectedDropdownOption('Option 2');
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );

        // Navigate to `test-snaps` page, we don't need to connect because the Snap uses
        // initialConnections to pre-approve the dapp.
        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('getSettingsStateButton');
        const jsonTextValidation = '"setting1": true';
        await testSnaps.check_messageResultSpan(
          'rpcResultSpan',
          jsonTextValidation,
        );
      },
    );
  });

  it('can use initialConnections to allow JSON-RPC', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage();

        // This test clicks this button without connecting and functions as E2E
        // for the initialConnections functionality.
        await testSnaps.scrollAndClickButton('showPreinstalledDialogButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: '.snap-ui-renderer__text',
          text: 'This is a custom dialog. It has a custom footer and can be resolved to any value.',
        });
      },
    );
  });
});

async function navigateToPreInstalledExample(driver: Driver) {
  const headerNavbar = new HeaderNavbar(driver);
  const settingsPage = new SettingsPage(driver);
  const preInstalledExample = new PreinstalledExampleSettings(driver);

  await headerNavbar.openSettingsPage();

  await settingsPage.goToPreInstalledExample();
  await preInstalledExample.check_pageIsLoaded();
}
