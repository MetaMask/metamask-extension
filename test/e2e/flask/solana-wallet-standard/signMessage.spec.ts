import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { largeDelayMs, veryLargeDelayMs, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  account1,
  assertSignedMessageIsValid,
  clickConfirmButton,
  connectSolanaTestDapp,
} from './testHelpers';

describe('Solana Wallet Standard - Sign Message', function () {
  describe('Sign a message', function () {
    it('Should sign a message', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);
          const messageToSign = 'Hello, world!';
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await connectSolanaTestDapp(driver, testDapp);
          await testDapp.checkPageIsLoaded();

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
