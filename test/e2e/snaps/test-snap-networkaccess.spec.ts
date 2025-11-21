import { Mockttp } from 'mockttp';
import { withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import { mockNetworkSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH } from '../constants';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockTestSnapsSite } from '../mock-response-data/snaps/snap-local-sites/test-snaps-site-mocks';
import { TEST_SNAPS_WEBSITE_URL } from './enums';

describe('Test Snap networkAccess', function () {
  it('test the network-access endowment', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: async (mockServer: Mockttp) => {
          const mocks = [
            await mockTestSnapsSite(mockServer),
            await mockNetworkSnap(mockServer),
          ];
          return mocks;
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // We cannot go to localhost directly because snap permissions doen't allow localhost (but they do metamask.github.io).
        // So instead, we go to the real URL and we use a proxy it so the responses come from the localhost test-snap server.
        // Open the test snaps page and install the snap network access
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNetworkAccessButton',
          {
            url: TEST_SNAPS_WEBSITE_URL,
          },
        );
        await testSnaps.checkInstallationComplete(
          'connectNetworkAccessButton',
          'Reconnect to Network Access Snap',
        );

        // click on alert dialog and validate the message
        await testSnaps.fillNetworkInput(
          'https://metamask.github.io/snaps/test-snaps/2.28.1/test-data.json',
        );
        await testSnaps.clickButton('sendNetworkAccessTestButton');
        await driver.delay(500);
        await testSnaps.checkMessageResultSpan(
          'networkAccessResultSpan',
          '"hello": "world"',
        );

        await testSnaps.clickButton('startWebSocket');
        await driver.delay(500);

        await testSnaps.waitForWebSocketUpdate({
          open: true,
          origin: 'ws://localhost:8545',
          blockNumber: 'number',
        });

        await testSnaps.clickButton('stopWebSocket');

        await testSnaps.waitForWebSocketUpdate({
          open: false,
          origin: null,
          blockNumber: null,
        });
      },
    );
  });
});
