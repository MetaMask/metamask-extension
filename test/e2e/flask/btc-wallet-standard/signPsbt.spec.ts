import {
  TestDappBitcoin,
  availableConnectionTypes,
} from '../../page-objects/pages/test-dapp-bitcoin';
import { connectBitcoinTestDapp } from '../../page-objects/flows/bitcoin-dapp.flow';
import { WINDOW_TITLES } from '../../constants';
import {
  clickConfirmButton,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
  psbt,
  signedPsbt,
  withBtcWalletStandardSnap,
} from './testHelpers';

describe('Bitcoin Wallet Standard - Sign psbt - e2e tests', function () {
  availableConnectionTypes.forEach((connectionLibrary) => {
    it(`Signs a psbt with ${connectionLibrary}`, async function () {
      await withBtcWalletStandardSnap(
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

          // Approve the confirmation dialog
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);

          await testDapp.verifySignedPsbt(signedPsbt);
        },
      );
    });
  });
});
