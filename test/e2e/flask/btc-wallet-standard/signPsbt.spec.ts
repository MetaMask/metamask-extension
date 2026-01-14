import { strict as assert } from 'assert';
import { withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { WINDOW_TITLES } from '../../helpers';
import {
  assertConnected,
  connectBitcoinTestDapp,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
  psbt,
  signedPsbt
} from './testHelpers';

describe('Bitcoin Wallet Standard - Sign psbt - e2e tests', function () {
  const connectionLibraryOptions: ('sats-connect' | 'wallet-standard')[] = ['sats-connect', 'wallet-standard'];

  connectionLibraryOptions.forEach((connectionLibrary) => {
    describe(`Bitcoin Wallet Standard - Sign psbt - ${connectionLibrary}`, function () {
      it('Should sign a psbt', async function () {
        await withBtcAccountSnap(
          {
            ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
          },
          async (driver) => {
            const testDapp = new TestDappBitcoin(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded()
  
            // 1. Connect
            const header = await testDapp.getHeader();
            await connectBitcoinTestDapp(driver, testDapp, { connectionLibrary });


            await testDapp.switchToMainnet();
  
            // Verify successful connection
            const connectionStatusAfterConnect =
              await header.getConnectionStatus();
            assertConnected(connectionStatusAfterConnect);
  

            // 2. Send transaction
            const signPsbtTest = await testDapp.getSignPsbtTest()
            await signPsbtTest.setPsbt(psbt);
            await signPsbtTest.signPsbt();


              await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
              const signedPsbtResult = await signPsbtTest.getSignedPsbt();

              assert.strictEqual(signedPsbtResult, signedPsbt);
          },
        );
      });
    });
  })
});
