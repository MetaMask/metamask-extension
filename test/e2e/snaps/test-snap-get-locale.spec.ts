import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HomePage from '../page-objects/pages/home/homepage';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import GeneralSettings from '../page-objects/pages/settings/general-settings';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { withFixtures } from '../helpers';
import { mockLocalizationSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';

describe('Test Snap Get Locale', function () {
  it('test snap_getLocale functionality', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockLocalizationSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectGetLocaleButton',
        );
        await testSnaps.checkInstallationComplete(
          'connectGetLocaleButton',
          'Reconnect to Localization Snap',
        );

        await testSnaps.clickButton('sendGetLocaleHelloButton');
        await testSnaps.checkMessageResultSpan(
          'getLocaleResultSpan',
          '"Hello, world!"',
        );

        const homePage = new HomePage(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await homePage.headerNavbar.openSettingsPage();

        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();
        await generalSettings.changeLanguage('Dansk');

        await generalSettings.assertLoadingOverlayNotPresent();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.closeSettingsPage();

        await homePage.headerNavbar.openSnapListPage();
        await driver.waitForSelector({
          text: 'Oversættelses Eksempel Snap',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('sendGetLocaleHelloButton');
        await testSnaps.checkMessageResultSpan(
          'getLocaleResultSpan',
          '"Hej, verden!"',
        );
      },
    );
  });
});
