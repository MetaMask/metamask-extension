import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';

describe('Solana Wallet Standard - Transfer WSOL', function () {
  describe('Send WSOL transactions', function () {
    it('Should sign and send multiple WSOL transactions', async function () {
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

          // 1. Sign multiple transactions
          const sendWSolTest = await testDapp.getSendWSolTest();
          await sendWSolTest.setNbAddresses('2');
          await sendWSolTest.setAmount('0.0001');
          await sendWSolTest.checkMultipleTransaction(true);
          await sendWSolTest.signTransaction();

          // Confirm the first signature
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await driver.delay(largeDelayMs);

          // Confirm the second signature
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          // Assert that the transactions were signed
          const signedTransactions = await sendWSolTest.getSignedTransactions();
          assert.strictEqual(signedTransactions.length, 2);
          assert.ok(signedTransactions[0]);
          assert.ok(signedTransactions[1]);

          // 2. Send multiple transactions
          await sendWSolTest.sendTransaction();
          // Confirm the first transaction
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);

          await driver.delay(largeDelayMs);

          // Confirm the second transaction
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          // Assert that transaction hashes were received
          const transactionHashes = await sendWSolTest.getTransactionHashs();
          assert.strictEqual(transactionHashes.length, 2);
          assert.ok(transactionHashes[0]);
          assert.ok(transactionHashes[1]);
        },
      );
    });
  });
});
