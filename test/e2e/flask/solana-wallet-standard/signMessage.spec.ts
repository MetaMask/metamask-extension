import { strict as assert } from 'assert';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';

describe('Solana Wallet Standard - Sign Message', function () {
  describe('Sign a message', function () {
    it('Should sign a message', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await connectSolanaTestDapp(driver, testDapp);

          const signMessageTest = await testDapp.getSignMessageTest();
          await signMessageTest.setMessage('Hello, world!');

          await signMessageTest.signMessage();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          await testDapp.switchTo();

          const signedMessage = await signMessageTest.getSignedMessage();

          assert.strictEqual(signedMessage.length, 1);
          assert.ok(signedMessage[0]);
        },
      );
    });
  });
});
