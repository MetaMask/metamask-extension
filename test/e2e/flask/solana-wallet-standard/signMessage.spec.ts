import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { largeDelayMs, veryLargeDelayMs, WINDOW_TITLES } from '../../helpers';
import { withSolanaAccountSnap } from '../../tests/solana/common-solana';
import {
  account1,
  assertSignedMessageIsValid,
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Solana Wallet Standard - Sign Message', function () {
  describe('Sign a message', function () {
    it('Should sign a message', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const messageToSign = 'Hello, world!';
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await connectSolanaTestDapp(driver, testDapp);
          await testDapp.check_pageIsLoaded();

          const signMessageTest = await testDapp.getSignMessageTest();
          await signMessageTest.setMessage(messageToSign);

          await signMessageTest.signMessage();

          await driver.delay(veryLargeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          await testDapp.switchTo();

          await driver.delay(largeDelayMs);
          const signedMessage = await signMessageTest.getSignedMessage();

          assertSignedMessageIsValid({
            signedMessageBase64: signedMessage[0],
            originalMessageString: messageToSign,
            publicKeyBase58: account1,
          });
        },
      );
    });
  });
});
