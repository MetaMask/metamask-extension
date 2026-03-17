import { Mockttp } from 'mockttp';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import SnapInstallWarning from '../page-objects/pages/dialog/snap-install-warning';
import { Driver } from '../webdriver/driver';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import {
  mockBip32Snap,
  mockBip44Snap,
} from '../mock-response-data/snaps/snap-binary-mocks';

async function mockSnapBinaries(mockServer: Mockttp) {
  return [await mockBip32Snap(mockServer), await mockBip44Snap(mockServer)];
}

describe('Test Snap Multi Install', function () {
  it('test multi install snaps', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        failOnConsoleError: false,
        fixtures: new FixtureBuilderV2()
          .withAppStateController({
            snapsInstallPrivacyWarningShown: true,
          })
          .build(),
        testSpecificMock: mockSnapBinaries,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);
        const snapInstallWarning = new SnapInstallWarning(driver);

        // Navigate to test snaps page and click multi-install
        await testSnaps.openPage();
        await testSnaps.checkPageIsLoaded();
        await testSnaps.scrollAndClickButton('connectMultiInstallButton');

        // Switch to dialog and connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.checkPageIsLoaded();
        await snapInstall.clickConnectButton();

        // First snap (BIP-32): confirm, approve warning, then OK to continue
        await snapInstall.clickConfirmButton();
        await snapInstallWarning.checkPageIsLoaded();
        await snapInstallWarning.clickCheckboxPermission();
        await snapInstallWarning.clickConfirmButton();
        await snapInstall.clickOkButtonAndContinueOnDialog();

        // Second snap (BIP-44): confirm, approve warning, then OK to close
        await snapInstall.clickConfirmButton();
        await snapInstallWarning.checkPageIsLoaded();
        await snapInstallWarning.clickCheckboxPermission();
        await snapInstallWarning.clickConfirmButton();
        await snapInstall.clickOkButton();

        // Switch back and verify both snaps are installed
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkInstalledSnapsResult(
          'npm:@metamask/bip32-example-snap, npm:@metamask/bip44-example-snap',
        );
      },
    );
  });
});
