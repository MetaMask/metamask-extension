import { strict as assert } from 'assert';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { buildSolanaTestSpecificMock } from '../../tests/solana/common-solana';
import { connectSolanaTestDapp } from './testHelpers';

describe('Solana Wallet Standard - Transfer WSOL', function () {
  describe('Send WSOL transactions', function () {
    it('Should sign and send multiple WSOL transactions', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
          },
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
            mockTokenAccountAccountInfo: false,
            walletConnect: false,
          }),
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
          console.log('1. Sign multiple transactions');
          const sendWSolTest = await testDapp.getSendWSolTest();
          await sendWSolTest.signTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const signTxConfirmation = new SnapTransactionConfirmation(driver);
          let dialogHandle = await driver.getCurrentWindowHandle();
          await signTxConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();

          await driver.waitForWindowToClose(dialogHandle);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await signTxConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();
          await testDapp.switchTo();

          const signedTransactions = await sendWSolTest.getSignedTransactions();
          assert.strictEqual(signedTransactions.length, 2);
          assert.ok(signedTransactions[0]);
          assert.ok(signedTransactions[1]);

          // 2. Send multiple transactions
          console.log('2. Send multiple transactions');
          await sendWSolTest.sendTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          dialogHandle = await driver.getCurrentWindowHandle();
          const txConfirmation = new SnapTransactionConfirmation(driver);
          await txConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();

          await driver.waitForWindowToClose(dialogHandle);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await txConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();
          await testDapp.switchTo();

          const transactionHashes = await sendWSolTest.getTransactionHashs();
          assert.strictEqual(transactionHashes.length, 2);
          assert.ok(transactionHashes[0]);
          assert.ok(transactionHashes[1]);
        },
      );
    });
  });
});
