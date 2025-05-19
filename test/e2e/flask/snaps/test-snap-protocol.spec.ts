import { strict as assert } from 'assert';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import { largeDelayMs } from '../../helpers';
import TestDappMultichain from '../../page-objects/pages/test-dapp-multichain';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../multichain-api/testHelpers';
import { withSolanaAccountSnap } from '../../tests/solana/common-solana';

describe('Test Protocol Snaps', function () {
  it('can call getBlockHeight exposed by Snap', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        withProtocolSnap: true,
        ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
      },
      async (driver, mockServer, extensionId) => {
        const mockBlockHeight = 368556246;
        await mockServer
          .forPost('https://api.devnet.solana.com/')
          .thenJson(200, {
            id: 1,
            jsonrpc: '2.0',
            result: mockBlockHeight,
          });

        const devnetScope = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectProtocolButton',
        );

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes([devnetScope]);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        await driver.delay(largeDelayMs);

        const blockHeight = await testDapp.invokeMethod(
          devnetScope,
          'getBlockHeight',
          [],
        );
        assert.strictEqual(blockHeight, mockBlockHeight);
      },
    );
  });
});
