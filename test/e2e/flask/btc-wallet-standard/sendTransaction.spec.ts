import { strict as assert } from 'assert';
import { withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { regularDelayMs } from '../../helpers';
import { SECONDARY_BTC_ADDRESS, WINDOW_TITLES } from '../../constants';
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
    it(`Sends a transaction with ${connectionLibrary}`, async function () {
      await withBtcAccountSnap(
        {
          ...DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappBitcoin(driver);
          await testDapp.openTestDappPage();

          // 1. Connect
          await connectBitcoinTestDapp(driver, testDapp, { connectionLibrary });

          await testDapp.switchToMainnet();

          // 2. Send transaction
          await testDapp.setRecepient(SECONDARY_BTC_ADDRESS);
          await testDapp.setAmount('1000');
          await testDapp.sendTransaction();

          // Sats-connect does not print the transaction hash
          if (connectionLibrary === 'sats-connect') {
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            await clickConfirmButton(driver);
          }

          // Wallet-standard uses signPsbt which does not prompt the user for confirmation
          // Once signPsbt is updated in the snap to required confirmation this must be removed
          if (connectionLibrary === 'wallet-standard') {
            await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
            await testDapp.verifyTransactionHash(txHashShort);
          }
        },
      );
    });
  })
});
