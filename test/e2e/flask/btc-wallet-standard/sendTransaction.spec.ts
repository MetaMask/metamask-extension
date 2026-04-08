import {
  TestDappBitcoin,
  WalletConnectionType,
  availableConnectionTypes,
} from '../../page-objects/pages/test-dapp-bitcoin';
import { connectBitcoinTestDapp } from '../../page-objects/flows/bitcoin-dapp.flow';
import { SECONDARY_BTC_ADDRESS, WINDOW_TITLES } from '../../constants';
import {
  clickConfirmButton,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
  txHashShort,
  withBtcWalletStandardSnap,
} from './testHelpers';

describe('Bitcoin Wallet Standard - Send transaction - e2e tests', function () {
  availableConnectionTypes.forEach((connectionLibrary) => {
    it(`Sends a transaction with ${connectionLibrary}`, async function () {
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

          // 2. Send transaction
          await testDapp.setRecepient(SECONDARY_BTC_ADDRESS);
          await testDapp.setAmount('1000');
          await testDapp.sendTransaction();

          // Both sats-connect and wallet-standard require confirmation
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          if (connectionLibrary === WalletConnectionType.Standard) {
            await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
            await testDapp.verifyTransactionHash(txHashShort);
          }
        },
      );
    });
  });
});
