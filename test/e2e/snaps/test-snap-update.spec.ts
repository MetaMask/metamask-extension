import { Mockttp } from 'mockttp';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { Driver } from '../webdriver/driver';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixtures/fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import {
  mockWebpackPluginOldSnap,
  mockWebpackPluginSnap,
} from '../mock-response-data/snaps/snap-binary-mocks';

async function mockSnapExamples(mockServer: Mockttp) {
  return [
    await mockWebpackPluginOldSnap(mockServer),
    await mockWebpackPluginSnap(mockServer),
  ];
}

describe('Test Snap update', function () {
  it('can install an old and then updated version', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapExamples,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page, connect update, complete installation and validate
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectUpdateButton',
        );
        await testSnaps.checkConnectUpdateButtonText(
          'Reconnect to Update Snap',
        );

        // Click update snap and check the installation status
        await testSnaps.clickConnectUpdateNewButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Update request' });
        await snapInstall.checkPageIsLoaded();
        await snapInstall.updateScrollAndClickConfirmButton();
        await snapInstall.clickOkButton();

        // Switch to test snap page and validate the version text
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkUpdateVersionSpan('"2.1.3"');
      },
    );
  });
});
