import { strict as assert } from 'assert';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';
import { withSolanaAccountSnap } from '../../tests/solana/common-solana';
import {
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Solana Wallet Standard - Transfer WSOL', function () {
  describe('Send WSOL transactions', function () {
    it('Should sign and send multiple WSOL transactions', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          mockGetTransactionSuccess: true,
          walletConnect: false,
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.check_pageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            includeDevnet: true,
          });

          // 1. Sign multiple transactions
          const sendWSolTest = await testDapp.getSendWSolTest();
          await sendWSolTest.signTransaction();
          // Confirm the first signature
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          // Confirm the second signature
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          // Assert that the transactions were signed
          await driver.delay(largeDelayMs);
          const signedTransactions = await sendWSolTest.getSignedTransactions();
          assert.strictEqual(signedTransactions.length, 2);
          assert.ok(signedTransactions[0]);
          assert.ok(signedTransactions[1]);

          // 2. Send multiple transactions
          await sendWSolTest.sendTransaction();
          // Confirm the first transaction
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          // Confirm the second transaction
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          // Assert that transaction hashes were received
          await driver.delay(largeDelayMs);
          const transactionHashes = await sendWSolTest.getTransactionHashs();
          assert.strictEqual(transactionHashes.length, 2);
          assert.ok(transactionHashes[0]);
          assert.ok(transactionHashes[1]);
        },
      );
    });
  });
});
