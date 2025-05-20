import { withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import { mockNetworkSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';

describe('Test Snap networkAccess', function () {
  it('test the network-access endowment', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockNetworkSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Open the test snaps page and install the snap network access
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNetworkAccessButton',
        );
        await testSnaps.check_installationComplete(
          'connectNetworkAccessButton',
          'Reconnect to Network Access Snap',
        );

        // click on alert dialog and validate the message
        await testSnaps.clickButton('sendNetworkAccessTestButton');
        await driver.delay(500);
        await testSnaps.check_messageResultSpan(
          'networkAccessResultSpan',
          '"hello": "world"',
        );
      },
    );
  });
});
