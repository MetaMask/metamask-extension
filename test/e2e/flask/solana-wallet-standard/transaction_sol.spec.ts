import { strict as assert } from 'assert';
import { SolScope } from '@metamask/keyring-api';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { buildSolanaFixtureScopes } from '../../fixtures/permission-scopes';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { buildSolanaTestSpecificMock } from '../../tests/solana/common-solana';
import { connectSolanaTestDapp } from '../../page-objects/flows/solana-dapp.flow';

// The dapp needs the Devnet scope, which a live connect cannot grant, so the
// session is seeded with Mainnet + Devnet and restored silently on connect.
const SOLANA_MAINNET_AND_DEVNET_PERMISSIONS = buildSolanaFixtureScopes([
  SolScope.Mainnet,
  SolScope.Devnet,
]);

describe('Solana Wallet Standard - Transfer SOL', function () {
  describe('Send a transaction', function () {
    it('Should send a transaction', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp({
              scopes: SOLANA_MAINNET_AND_DEVNET_PERMISSIONS,
            })
            .build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
          },
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
          }),
        },
        async ({ driver }) => {
          await login(driver);
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            expectExistingSession: true,
          });

          // 1. Sign a transfer transaction
          const sendSolTest = await testDapp.getSendSolTest();
          await sendSolTest.signTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const signTxConfirmation = new SnapTransactionConfirmation(driver);
          await signTxConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();
          await testDapp.switchTo();

          const signedTransaction = await sendSolTest.getSignedTransaction();
          assert.strictEqual(signedTransaction.length, 1);
          assert.ok(signedTransaction[0]);

          // 2. Send the transaction
          await sendSolTest.sendTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new SnapTransactionConfirmation(driver);
          await txConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();
          await testDapp.switchTo();

          const transactionHash = await sendSolTest.getTransactionHash();
          assert.ok(transactionHash);
        },
      );
    });

    it('Should be able to cancel a transaction and send another one', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp({
              scopes: SOLANA_MAINNET_AND_DEVNET_PERMISSIONS,
            })
            .build(),
          title: this.test?.fullTitle(),
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
          },
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
          }),
        },
        async ({ driver }) => {
          await login(driver);
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            expectExistingSession: true,
          });

          // 1. Start a transaction and cancel it
          const sendSolTest = await testDapp.getSendSolTest();
          await sendSolTest.sendTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const dialogHandle = await driver.getCurrentWindowHandle();
          const cancelTxConfirmation = new SnapTransactionConfirmation(driver);
          await cancelTxConfirmation.clickFooterCancelButtonAndWaitForWindowToClose();
          await testDapp.switchTo();

          // 2. Send another transaction
          await sendSolTest.sendTransaction();

          await driver.waitForWindowToClose(dialogHandle);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const txConfirmation = new SnapTransactionConfirmation(driver);
          await txConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();
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
            fixtures: new FixtureBuilderV2()
              .withPermissionControllerConnectedToTestDapp({
                scopes: SOLANA_MAINNET_AND_DEVNET_PERMISSIONS,
              })
              .build(),
            title: this.test?.fullTitle(),
            dappOptions: {
              customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
            },
            testSpecificMock: buildSolanaTestSpecificMock({
              mockGetTransactionSuccess: true,
            }),
          },
          async ({ driver }) => {
            await login(driver);
            const testDapp = new TestDappSolana(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await connectSolanaTestDapp(driver, testDapp, {
              expectExistingSession: true,
            });

            // Send a transaction
            const sendSolTest = await testDapp.getSendSolTest();
            await sendSolTest.sendTransaction();

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const txConfirmation = new SnapTransactionConfirmation(driver);
            await txConfirmation.checkNetworkIsDisplayed('Solana Devnet');
            await txConfirmation.clickFooterConfirmButtonAndWaitForWindowToClose();
          },
        );
      });
    });
  });
});
