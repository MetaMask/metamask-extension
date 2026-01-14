import { strict as assert } from 'assert';
import { SIGNED_MESSAGES_MOCK, withBtcAccountSnap } from '../btc/common-btc';
import { TestDappBitcoin } from '../../page-objects/pages/test-dapp-bitcoin';
import { regularDelayMs, WINDOW_TITLES, veryLargeDelayMs } from '../../helpers';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import NetworkPermissionSelectModal from '../../page-objects/pages/dialog/network-permission-select-modal';
import { DEFAULT_BTC_ADDRESS } from '../../constants';
import {
  assertConnected,
  assertDisconnected,
  assertSignedMessageIsValid,
  clickConfirmButton,
  connectBitcoinTestDapp,
  DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Bitcoin Wallet Standard - Sign Message - e2e tests', function () {
  const connectionLibraryOptions: ('sats-connect' | 'wallet-standard')[] = ['wallet-standard', 'sats-connect'];
  const messageToSign = 'Hello, world! This is a test message.';

  connectionLibraryOptions.forEach((connectionLibrary) => {
    describe(`Bitcoin Wallet Standard - Sign Message - ${connectionLibrary}`, function () {
      it('Should sign a message', async function () {
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
  
            // Verify successful connection
            const connectionStatusAfterConnect =
              await header.getConnectionStatus();
            assertConnected(connectionStatusAfterConnect);
  

            // 2. Sign a message
            const signMessageTest = await testDapp.getSignMessageTest();
            await signMessageTest.setMessage(messageToSign);
            await signMessageTest.signMessage();

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            await clickConfirmButton(driver);
            
            // 3. Verify the signed message
            await driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
            const signedMessage = await signMessageTest.getSignedMessage();

            assert.equal(signedMessage[0], SIGNED_MESSAGES_MOCK[connectionLibrary]);
          },
        );
      });
    });
  })
});
