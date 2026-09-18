import {
  TestDappBitcoin,
  availableConnectionTypes,
} from '../../page-objects/pages/test-dapp-bitcoin';
import { connectBitcoinTestDapp } from '../../page-objects/flows/bitcoin-dapp.flow';
import BitcoinDappConfirmation from '../../page-objects/pages/confirmations/bitcoin-dapp-confirmation';
import { WINDOW_TITLES } from '../../constants';
import {
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
  SIGNED_MESSAGES_MOCK,
  withBtcWalletStandardSnap,
} from './testHelpers';

describe('Bitcoin Wallet Standard - Sign Message - e2e tests', function () {
  const messageToSign = 'Hello, world! This is a test message.';

  availableConnectionTypes.forEach((connectionLibrary) => {
    it(`Signs a message with ${connectionLibrary}`, async function () {
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

          // 2. Sign a message
          await testDapp.setMessage(messageToSign);
          await testDapp.signMessage();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const bitcoinDappConfirmation = new BitcoinDappConfirmation(driver);
          await bitcoinDappConfirmation.clickApprove();

          // 3. Verify the signed message
          await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);

          await testDapp.verifySignedMessage(
            SIGNED_MESSAGES_MOCK[connectionLibrary],
          );
        },
      );
    });
  });
});
