import { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixtures/fixture-builder';
import { mockManageStateSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH } from '../constants';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';

describe('Test Snap manageState', function () {
  it('can use the new state API', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
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
          'clickConnectStateButton',
        );
        await testSnaps.checkConnectStateButtonText('Reconnect to State Snap');

        // Enter data and click set, then validate results
        await testSnaps.fillSetStateKeyInput('foo');
        await testSnaps.fillDataStateInput('"bar"');
        await testSnaps.clickSendStateButton();
        await testSnaps.checkEncryptedStateResult(
          JSON.stringify({ foo: 'bar' }, null, 2),
        );

        // Retrieve one state key and validate
        await testSnaps.fillGetStateInput('foo');
        await testSnaps.clickSendGetStateButton();
        await testSnaps.checkGetStateResult('"bar"');

        // Clear results and validate
        await testSnaps.clickClearStateButton();
        await testSnaps.checkEncryptedStateResult('null');

        // Repeat the same steps for unencrypted state management
        await testSnaps.fillSetStateKeyUnencryptedInput('foo');
        await testSnaps.fillDataUnencryptedStateInput('"bar"');
        await testSnaps.clickSendUnencryptedStateButton();
        await testSnaps.checkUnencryptedStateResult(
          JSON.stringify({ foo: 'bar' }, null, 2),
        );

        await testSnaps.fillGetUnencryptedStateInput('foo');
        await testSnaps.clickSendGetUnencryptedStateButton();
        await testSnaps.checkGetStateUnencryptedResult('"bar"');

        await testSnaps.clickClearStateUnencryptedButton();
        await testSnaps.checkUnencryptedStateResult('null');
      },
    );
  });

  it('can use the legacy state API', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockManageStateSnap,
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page and connect manage state and validate installation
        await openTestSnapClickButtonAndInstall(
          driver,
          'clickConnectManageStateButton',
        );
        await testSnaps.checkConnectManageStateButtonText(
          'Reconnect to Legacy State Snap',
        );

        // enter data, click send manage state and validate results
        await testSnaps.fillDataManageStateInput('23');
        await testSnaps.clickSendManageStateButton();
        await testSnaps.checkSendManageStateResult('true');
        await testSnaps.checkRetrieveManageStateResult('23');
        await testSnaps.clickClearManageStateButton();
        await testSnaps.checkClearManageStateResult('true');
        await testSnaps.checkRetrieveManageStateResult('[]');

        // check unencrypted state management and validate results
        await testSnaps.fillDataUnencryptedManageStateInput('23');
        await testSnaps.clickSendUnencryptedManageStateButton();
        await testSnaps.checkSendUnencryptedManageStateResult('true');
        await testSnaps.checkRetrieveManageStateUnencryptedResult('23');
        await testSnaps.clickClearUnencryptedManageStateButton();
        await testSnaps.checkClearUnencryptedManageStateResult('true');
        await testSnaps.checkRetrieveManageStateUnencryptedResult('[]');
      },
    );
  });
});
