import { strict as assert } from 'assert';
import { withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { WINDOW_TITLES } from '../../constants';
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
    it(`Signs a psbt with ${connectionLibrary}`, async function () {
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

          // 2. Sign psbt
          await testDapp.setPsbt(psbt);
          await testDapp.signPsbt();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);

          await testDapp.verifySignedPsbt(signedPsbt);
        },
      );
    });
  })
});
