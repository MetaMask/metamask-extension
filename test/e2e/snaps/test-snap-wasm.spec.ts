import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockWasmSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap WASM', function () {
  it('can use webassembly inside a snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockWasmSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        // Navigate to test snaps page and connect to wasm snap
        await openTestSnapClickButtonAndInstall(driver, 'connectWasmButton');

        // Check installation success
        await testSnaps.check_installationComplete(
          'connectWasmButton',
          'Reconnect to WebAssembly Snap',
        );

        // Enter number for test to input field and validate the result
        await testSnaps.fillMessage('wasmInput', '23');
        await testSnaps.clickButton('sendWasmMessageButton');
        await testSnaps.check_messageResultSpan('wasmResultSpan', '28657');
      },
    );
  });
});
