import { Mockttp } from 'mockttp';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import {
  mockBip32Snap,
  mockJsonRpcSnap,
} from '../mock-response-data/snaps/snap-binary-mocks';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { Driver } from '../webdriver/driver';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import SnapInstall from '../page-objects/pages/dialog/snap-install';

async function mockSnapBinaries(mockServer: Mockttp) {
  return [await mockBip32Snap(mockServer), await mockJsonRpcSnap(mockServer)];
}

describe('Test Snap RPC', function () {
  it('can use the cross-snap RPC endowment and produce a public key', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapBinaries,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);
        await openTestSnapClickButtonAndInstall(driver, 'connectBip32Button', {
          withWarning: true,
          withExtraScreen: true,
        });
        await testSnaps.scrollAndClickButton('connectJsonRpcButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.clickConnectButton();
        await snapInstall.clickConfirmButton();
        await snapInstall.clickOkButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_installationComplete(
          'connectJsonRpcButton',
          'Reconnect to JSON-RPC Snap',
        );
        await testSnaps.scrollAndClickButton('sendRpcButton');
        await testSnaps.check_messageResultSpan(
          'rpcResultSpan',
          '"0x033e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366"',
        );
      },
    );
  });
});
