import { strict as assert } from 'assert';
import SnapSignTransactionConfirmation from '../../page-objects/pages/confirmations/snap-sign-transaction-confirmation';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { buildSolanaTestSpecificMock } from '../../tests/solana/common-solana';
import { connectSolanaTestDapp } from './testHelpers';

describe('Solana Wallet Standard - Transfer SOL', function () {
  describe('Send a transaction', function () {
    it('Should send a transaction', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
          },
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
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

          // 1. Sign a transfer transaction
          const sendSolTest = await testDapp.getSendSolTest();
          await sendSolTest.signTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const signTxConfirmation = new SnapSignTransactionConfirmation(
            driver,
          );
          await signTxConfirmation.checkPageIsLoaded();
          await signTxConfirmation.clickFooterConfirmButton();
          await testDapp.switchTo();

          const signedTransaction = await sendSolTest.getSignedTransaction();
          assert.strictEqual(signedTransaction.length, 1);
          assert.ok(signedTransaction[0]);

          // 2. Send the transaction
          await sendSolTest.sendTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new SnapTransactionConfirmation(driver);
          await txConfirmation.checkPageIsLoaded();
          await txConfirmation.clickFooterConfirmButton();
          await testDapp.switchTo();

          const transactionHash = await sendSolTest.getTransactionHash();
          assert.ok(transactionHash);
        },
      );
    });

    it('Should be able to cancel a transaction and send another one', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
          },
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
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

          // 1. Start a transaction and cancel it
          const sendSolTest = await testDapp.getSendSolTest();
          await sendSolTest.sendTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const cancelTxConfirmation = new SnapTransactionConfirmation(driver);
          await cancelTxConfirmation.checkPageIsLoaded();
          await cancelTxConfirmation.clickFooterCancelButton();
          await testDapp.switchTo();

          // 2. Send another transaction
          await sendSolTest.sendTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new SnapTransactionConfirmation(driver);
          await txConfirmation.checkPageIsLoaded();
          await txConfirmation.clickFooterConfirmButton();
          await testDapp.switchTo();

          const transactionHash = await sendSolTest.getTransactionHash();
          assert.ok(transactionHash);
        },
      );
    });

    describe('Given I have connected to Mainnet and Devnet', function () {
      it('Should use the Devnet scope as specified by the Dapp', async function () {
        await withFixtures(
          {
            fixtures: new FixtureBuilderV2().build(),
            title: this.test?.fullTitle(),
            dappOptions: {
              customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
            },
            testSpecificMock: buildSolanaTestSpecificMock({
              mockGetTransactionSuccess: true,
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

            // Send a transaction
            const sendSolTest = await testDapp.getSendSolTest();
            await sendSolTest.sendTransaction();

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const txConfirmation = new SnapTransactionConfirmation(driver);
            await txConfirmation.checkPageIsLoaded();
            await txConfirmation.checkNetworkIsDisplayed('Solana Devnet');
            await txConfirmation.clickFooterConfirmButton();
          },
        );
      });
    });
  });
});
