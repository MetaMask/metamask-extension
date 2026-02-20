import { strict as assert } from 'assert';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { WINDOW_TITLES } from '../../constants';
import { largeDelayMs, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  buildSolanaTestSpecificMock,
  SOLANA_MANIFEST_FLAGS,
  SOLANA_IGNORED_CONSOLE_ERRORS,
} from '../../tests/solana/common-solana';
import {
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Solana Wallet Standard - Transfer WSOL', function () {
  describe('Send WSOL transactions', function () {
    it('Should sign and send multiple WSOL transactions', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
          dappOptions: DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS.dappOptions,
          manifestFlags: SOLANA_MANIFEST_FLAGS,
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
            mockTokenAccountAccountInfo: false,
            walletConnect: false,
          }),
          ignoredConsoleErrors: SOLANA_IGNORED_CONSOLE_ERRORS,
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
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
