const { withFixtures, unlockWallet, WINDOW_TITLES } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  mockImagesSnap,
} = require('../mock-response-data/snaps/snap-binary-mocks');
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';

describe('Test Snap Images', function () {
  it('can display images in snap ui', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockImagesSnap,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(driver, 'connectImagesButton',{ withExtraScreen: true });

        // wait for npm installation success
        await testSnaps.check_installationComplete(
          'connectImagesButton',
          'Reconnect to Images Snap',
        );

        // find and click svg image test
        await driver.clickElement('#showSVGImage');

        // switch to notification window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check snaps ui image using waitForSelector
        await driver.waitForSelector('[data-testid="snaps-ui-image"]');

        // click ok to close window and wait for window to close
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirmation-submit-button"]',
        );

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // find and click png image test
        await driver.clickElement('#showPNGImage');

        // switch to notification window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check snaps ui image using waitForSelector
        await driver.waitForSelector('[data-testid="snaps-ui-image"]');
      },
    );
  });
});
