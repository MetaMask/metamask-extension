import { strict as assert } from 'assert';
import { isObject } from 'lodash';
import { WINDOW_TITLES } from '../../../helpers';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../testHelpers';
import { withSolanaAccountSnap } from '../../../tests/solana/common-solana';
import SnapTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/snap-transaction-confirmation';
import SnapSignInConfirmation from '../../../page-objects/pages/confirmations/redesign/snap-sign-in-confirmation';

// #37691 - Calling wallet_invokeMethod for signIn will fail with BIP44
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('Multichain API - Non EVM', function () {
  const SOLANA_SCOPE = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  describe('Calling `wallet_invokeMethod`', function () {
    describe('signIn method', function () {
      it('Should match selected method to the expected confirmation UI', async function () {
        await withSolanaAccountSnap(
          {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
          },
          async (driver, _, extensionId) => {
            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([SOLANA_SCOPE]);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            await testDapp.invokeMethod({
              scope: SOLANA_SCOPE,
              method: 'signIn',
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const confirmation = new SnapSignInConfirmation(driver);
            await confirmation.checkPageIsLoaded();
            await confirmation.checkAccountIsDisplayed('Solana 1');
            await confirmation.clickFooterConfirmButton();
          },
        );
      });
    });

    describe('signAndSendTransaction method', function () {
      it('Should match selected method to the expected confirmation UI', async function () {
        await withSolanaAccountSnap(
          {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
            mockGetTransactionSuccess: true,
          },
          async (driver, _, extensionId) => {
            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([SOLANA_SCOPE]);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const invokeMethod = 'signAndSendTransaction';

            await testDapp.invokeMethod({
              scope: SOLANA_SCOPE,
              method: invokeMethod,
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const confirmation = new SnapTransactionConfirmation(driver);
            await confirmation.checkPageIsLoaded();
            await confirmation.checkAccountIsDisplayed('Solana 1');
            await confirmation.clickFooterConfirmButton();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const transactionResult = await testDapp.getInvokeMethodResult({
              scope: SOLANA_SCOPE,
              method: invokeMethod,
            });
            const parsedTransactionResult = JSON.parse(transactionResult);

            assert.strictEqual(
              isObject(parsedTransactionResult),
              true,
              'transaction result object should exist',
            );

            assert.strictEqual(
              parsedTransactionResult.signature,
              'TE42WbnNvycJGiEVxVV7gjZ3wnCHvZAWFcA2b8rnvp2SZQoQQwirTbTfNBiZWHnzzkg38AayUob29w7eFD3SVGj',
              'transaction result signature should be defined',
            );
          },
        );
      });
    });
  });
});
