import { strict as assert } from 'assert';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';
import { WINDOW_TITLES } from '../../helpers';

describe('Solana Wallet Standard - Send Memo', function () {
  this.timeout(3000000); // do not remove this line

  describe('Send Memo transactions', function () {
    it('Should sign and send a memo transaction', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          mockCalls: true,
          simulateTransaction: false,
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await connectSolanaTestDapp(driver, testDapp, {
            includeDevnet: true,
          });

          const sendMemoTest = await testDapp.getSendMemoTest();
          await sendMemoTest.signTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          const signedTransaction = await sendMemoTest.getSignedTransaction();
          assert.strictEqual(signedTransaction.length, 1);
          assert.ok(signedTransaction[0]);

          await sendMemoTest.sendTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          await testDapp.switchTo();

          const transactionHash = await sendMemoTest.getSolscanShortContent();
          assert.ok(transactionHash);
        },
      );
    });
  });
});
