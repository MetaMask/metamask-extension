import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { mockJsxSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';

describe('Test Snap JSX', function () {
  it('can use JSX for snap dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockJsxSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);

        // Open the test snaps page
        await openTestSnapClickButtonAndInstall(driver, 'connectjsxButton');
        await testSnaps.check_installationComplete(
          'connectjsxButton',
          'Reconnect to JSX Snap',
        );

        await testSnaps.clickButton('displayJsxButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.check_Count('0');
        await testSnaps.clickButton('incrementButton');
        await testSnaps.check_Count('1');
      },
    );
  });
});
