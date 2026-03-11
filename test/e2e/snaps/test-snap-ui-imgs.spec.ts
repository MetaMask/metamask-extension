import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { withFixtures } from '../helpers';
import { mockImagesSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';

describe('Test Snap Images', function () {
  it('can display images in snap ui', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockImagesSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(driver, 'connectImagesButton');
        await testSnaps.checkInstallationComplete(
          'connectImagesButton',
          'Reconnect to Images Snap',
        );

        await testSnaps.clickButton('showSvgImageButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector('[data-testid="snaps-ui-image"]');
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirmation-submit-button"]',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('showPngImageButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector('[data-testid="snaps-ui-image"]');
      },
    );
  });
});
