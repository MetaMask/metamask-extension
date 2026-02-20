import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { WINDOW_TITLES } from '../../constants';
import { largeDelayMs, veryLargeDelayMs, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  buildSolanaTestSpecificMock,
  SOLANA_MANIFEST_FLAGS,
  SOLANA_IGNORED_CONSOLE_ERRORS,
} from '../../tests/solana/common-solana';
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
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
          dappOptions: DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS.dappOptions,
          manifestFlags: SOLANA_MANIFEST_FLAGS,
          testSpecificMock: buildSolanaTestSpecificMock(),
          ignoredConsoleErrors: SOLANA_IGNORED_CONSOLE_ERRORS,
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
