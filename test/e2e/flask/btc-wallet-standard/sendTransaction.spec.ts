import { strict as assert } from 'assert';
import { withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { regularDelayMs, WINDOW_TITLES } from '../../helpers';
import { SECONDARY_BTC_ADDRESS } from '../../constants';
import {
  assertConnected,
  clickConfirmButton,
  connectBitcoinTestDapp,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
  txHashShort,
} from './testHelpers';

describe('Bitcoin Wallet Standard - Send transaction - e2e tests', function () {
  const connectionLibraryOptions: ('sats-connect' | 'wallet-standard')[] = ['sats-connect', 'wallet-standard'];

  connectionLibraryOptions.forEach((connectionLibrary) => {
    describe(`Bitcoin Wallet Standard - Send transaction - ${connectionLibrary}`, function () {
      it('Should send a transaction', async function () {
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
            const sendTransaxrionTest = await testDapp.getSendTransactionTest()
            await sendTransaxrionTest.setRecepient(SECONDARY_BTC_ADDRESS);
            await sendTransaxrionTest.setAmount('1000');
            await sendTransaxrionTest.sendTransaction();


            // Wallet-standard uses signPsbt which does not prompt the user for confirmation
            // Once signPsbt is update in the snap to required confirmation this must be removed
            if (connectionLibrary === 'sats-connect') {
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
              await clickConfirmButton(driver);
              
              await driver.delay(regularDelayMs);
            }

            // Sats-connect does not print the transaction hash
            if (connectionLibrary === 'wallet-standard') {
              await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
              const transactionHash = await sendTransaxrionTest.getTransactionHash();

              assert.strictEqual(transactionHash, txHashShort);
            }
          },
        );
      });
    });
  })
});
