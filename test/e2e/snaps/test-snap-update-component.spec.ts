import { Mockttp } from 'mockttp';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import {
  mockWebpackPluginOldSnap,
  mockWebpackPluginSnap,
} from '../mock-response-data/snaps/snap-binary-mocks';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import SnapListPage from '../page-objects/pages/snap-list-page';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { Driver } from '../webdriver/driver';

async function mockSnaps(mockServer: Mockttp) {
  return [
    await mockWebpackPluginOldSnap(mockServer),
    await mockWebpackPluginSnap(mockServer),
  ];
}

describe('Test Snap update via snaps component', function () {
  it('can install an old and then update via the snaps component', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnaps,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const snapListPage = new SnapListPage(driver);
        const snapInstall = new SnapInstall(driver);

        await openTestSnapClickButtonAndInstall(driver, 'connectUpdateButton', {
          withExtraScreen: true,
        });
        await testSnaps.check_installationComplete(
          'connectUpdateButton',
          'Reconnect to Update Snap',
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.openSnapListPage();
        await snapListPage.clickWebpackPluginSnap();
        await snapListPage.clickUpdateSnapButton();
        await snapInstall.clickFooterConfirmButton();
        await snapInstall.clickOkButtonAndContinueOnDialog();
        await headerNavbar.openSnapListPage();
        await snapListPage.clickWebpackPluginSnap();
        await snapListPage.check_updateLinkIsNotDisplayed();
      },
    );
  });
});
