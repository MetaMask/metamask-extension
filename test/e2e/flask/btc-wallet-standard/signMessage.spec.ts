import { SIGNED_MESSAGES_MOCK, withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { connectBitcoinTestDapp } from '../../page-objects/flows/bitcoin-dapp.flow';
import { WINDOW_TITLES } from '../../constants';
import {
  clickConfirmButton,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Bitcoin Wallet Standard - Sign Message - e2e tests', function () {
  const connectionLibraryOptions: ('sats-connect' | 'wallet-standard')[] = ['sats-connect'];
  const messageToSign = 'Hello, world! This is a test message.';

  connectionLibraryOptions.forEach((connectionLibrary) => {
    it(`Signs a message with ${connectionLibrary}`, async function () {
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

          // 2. Sign a message
          await testDapp.setMessage(messageToSign);
          await testDapp.signMessage();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          
          // 3. Verify the signed message
          await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);

          await testDapp.verifySignedMessage(SIGNED_MESSAGES_MOCK[connectionLibrary]);
        },
      );
    });
  })
});
