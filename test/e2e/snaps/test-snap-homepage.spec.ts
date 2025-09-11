import { Suite } from 'mocha';
import { Driver } from '../webdriver/driver';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import SnapListPage from '../page-objects/pages/snap-list-page';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockHomePageSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap Homepage', function (this: Suite) {
  it('tests snap home page functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockHomePageSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        const snapListPage = new SnapListPage(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectHomePageButton',
        );

        // switch to metamask page and open the three dots menu
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
