import { Suite } from 'mocha';
import { Driver } from '../webdriver/driver';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import SnapListPage from '../page-objects/pages/snap-list-page';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';

describe('Test Snap Homepage', function (this: Suite) {
  it('tests snap home page functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const snapListPage = new SnapListPage(driver);

        await testSnaps.openPage();
        await testSnaps.clickConnectHomePage();
        await testSnaps.completeSnapInstallConfirmation();

        // switch to metamask page and open the three dots menu
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await headerNavbar.openSnapListPage();
        await snapListPage.clickHomePageSnap();

        // check that the home page appears and contains the right info
        await snapListPage.check_homePageTitle();
      },
    );
  });
});
