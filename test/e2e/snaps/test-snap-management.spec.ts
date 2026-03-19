import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HomePage from '../page-objects/pages/home/homepage';
import SnapListPage from '../page-objects/pages/snap-list-page';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { withFixtures } from '../helpers';
import { mockNotificationSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';

const NOTIFICATIONS_SNAP_NAME = 'Notifications Example Snap';

describe('Test Snap Management', function () {
  it('tests install disable enable and removal of a snap', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockNotificationSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNotificationButton',
        );

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.openSnapListPage();

        const snapListPage = new SnapListPage(driver);
        await snapListPage.openSnapByName(NOTIFICATIONS_SNAP_NAME);
        await snapListPage.toggleSnapEnabled();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('sendInAppNotificationButton');
        await driver.delay(1000);
        await driver.closeAlertPopup();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await snapListPage.toggleSnapEnabled();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('sendInAppNotificationButton');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await snapListPage.clickBackButton();
        await snapListPage.clickBackButton();

        await homePage.headerNavbar.clickNotificationCount(1);
        await driver.clickElement({
          text: NOTIFICATIONS_SNAP_NAME,
          tag: 'span',
        });
        await snapListPage.removeSnapViaPopover(NOTIFICATIONS_SNAP_NAME);
        await snapListPage.checkNoSnapsInstalledMessage();
      },
    );
  });
});
