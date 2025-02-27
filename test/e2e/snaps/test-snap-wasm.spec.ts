import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { completeSnapInstallConfirmation } from '../page-objects/flows/snap-permission.flow';

describe('Test Snap WASM', function () {
  it('can use webassembly inside a snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        // Navigate to test snaps page and connect to wasm snap
        await testSnaps.openPage();
        await testSnaps.clickConnectWasmButton();
        await completeSnapInstallConfirmation(driver);

        // Check installation success
        await testSnaps.check_installationComplete(
          testSnaps.connectWasmButton,
          'Reconnect to WebAssembly Snap',
        );

        // Enter number for test to input field and validate the result
        await testSnaps.fillWasmMessageAndSign('23');
        await testSnaps.check_messageResultSpan(this.wasmResultSpan, '28657');
      },
    );
  });
});
