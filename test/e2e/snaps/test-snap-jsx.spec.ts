import { DAPP_PATH, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixtures/fixture-builder';
import { mockJsxSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';

describe('Test Snap JSX', function () {
  it('can use JSX for snap dialog', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockJsxSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);

        // Open the test snaps page
        await openTestSnapClickButtonAndInstall(driver, 'connectJsxButton');
        await testSnaps.checkConnectJsxButtonText('Reconnect to JSX Snap');

        await testSnaps.clickDisplayJsxButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.checkCount('0');
        await testSnaps.clickIncrementButton();
        await testSnaps.checkCount('1');
      },
    );
  });
});
