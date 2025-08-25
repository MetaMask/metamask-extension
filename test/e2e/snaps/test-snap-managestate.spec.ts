import { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { mockManageStateSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';

describe('Test Snap manageState', function () {
  it('can use the new state API', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockManageStateSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page and connect manage state and validate installation
        await openTestSnapClickButtonAndInstall(driver, 'connectstateButton');
        await testSnaps.checkInstallationComplete(
          'connectstateButton',
          'Reconnect to State Snap',
        );

        // Enter data and click set, then validate results
        await testSnaps.fillMessage('setStateKeyInput', 'foo');
        await testSnaps.fillMessage('dataStateInput', '"bar"');
        await testSnaps.scrollAndClickButton('sendStateButton');
        await testSnaps.checkMessageResultSpan(
          'encryptedStateResultSpan',
          JSON.stringify({ foo: 'bar' }, null, 2),
        );

        // Retrieve one state key and validate
        await testSnaps.fillMessage('getStateInput', 'foo');
        await testSnaps.scrollAndClickButton('sendGetStateButton');
        await testSnaps.checkMessageResultSpan('getStateResultSpan', '"bar"');

        // Clear results and validate
        await testSnaps.clickButton('clearStateButton');
        await testSnaps.checkMessageResultSpan(
          'encryptedStateResultSpan',
          'null',
        );

        // Repeat the same steps for unencrypted state management
        await testSnaps.fillMessage('setStateKeyUnencryptedInput', 'foo');
        await testSnaps.fillMessage('dataUnencryptedStateInput', '"bar"');
        await testSnaps.scrollAndClickButton('sendUnencryptedStateButton');
        await testSnaps.checkMessageResultSpan(
          'unencryptedStateResultSpan',
          JSON.stringify({ foo: 'bar' }, null, 2),
        );

        await testSnaps.fillMessage('getUnencryptedStateInput', 'foo');
        await testSnaps.scrollAndClickButton('sendGetUnencryptedStateButton');
        await testSnaps.checkMessageResultSpan(
          'getStateUnencryptedResultSpan',
          '"bar"',
        );

        await testSnaps.clickButton('clearStateUnencryptedButton');
        await testSnaps.checkMessageResultSpan(
          'unencryptedStateResultSpan',
          'null',
        );
      },
    );
  });

  it('can use the legacy state API', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockManageStateSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page and connect manage state and validate installation
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectManageStateButton',
        );
        await testSnaps.checkInstallationComplete(
          'connectManageStateButton',
          'Reconnect to Legacy State Snap',
        );

        // enter data, click send manage state and validate results
        await testSnaps.fillMessage('dataManageStateInput', '23');
        await testSnaps.scrollAndClickButton('sendManageStateButton');
        await testSnaps.checkMessageResultSpan(
          'sendManageStateResultSpan',
          'true',
        );
        await testSnaps.checkMessageResultSpan(
          'retrieveManageStateResultSpan',
          '23',
        );
        await testSnaps.clickButton('clearManageStateButton');
        await testSnaps.checkMessageResultSpan(
          'clearManageStateResultSpan',
          'true',
        );
        await testSnaps.checkMessageResultSpan(
          'retrieveManageStateResultSpan',
          '[]',
        );

        // check unencrypted state management and validate results
        await testSnaps.fillMessage('dataUnencryptedManageStateInput', '23');
        await testSnaps.scrollAndClickButton(
          'sendUnencryptedManageStateButton',
        );
        await testSnaps.checkMessageResultSpan(
          'sendUnencryptedManageStateResultSpan',
          'true',
        );
        await testSnaps.checkMessageResultSpan(
          'retrieveManageStateUnencryptedResultSpan',
          '23',
        );
        await testSnaps.clickButton('clearUnencryptedManageStateButton');
        await testSnaps.checkMessageResultSpan(
          'clearUnencryptedManageStateResultSpan',
          'true',
        );
        await testSnaps.checkMessageResultSpan(
          'retrieveManageStateUnencryptedResultSpan',
          '[]',
        );
      },
    );
  });
});
