import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../multichain-api/testHelpers';
import { WINDOW_TITLES } from '../../helpers';
import { withSolanaAccountSnap } from '../../tests/solana/common-solana';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import TestDappMultichain from '../../page-objects/pages/test-dapp-multichain';

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
        await testDapp.check_pageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes([devnetScope]);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        await testDapp.check_pageIsLoaded();
        await testDapp.invokeMethodAndCheckResult({
          scope: devnetScope,
          method: 'getBlockHeight',
          expectedResult: mockBlockHeight.toString(),
        });
      },
    );
  });
});
