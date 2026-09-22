import { Suite } from 'mocha';
import { Driver } from '../webdriver/driver';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import HeaderNavbar from '../page-objects/pages/home/header-navbar';
import SnapListPage from '../page-objects/pages/snaps/list-page';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { login } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockHomePageSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap Homepage', function (this: Suite) {
  it('tests snap home page functionality', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockHomePageSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        const snapListPage = new SnapListPage(driver);
        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectHomePageButton',
        );
        await testSnaps.checkInstallationComplete(
          'connectHomePageButton',
          'Reconnect to Home Page Snap',
        );

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await headerNavbar.openSnapListPage();
        await snapListPage.clickHomePageSnap();

        // check that the home page appears and contains the right info
        await snapListPage.checkHomePageTitle();
      },
    );
  });
});
