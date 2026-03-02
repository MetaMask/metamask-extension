import { strict as assert } from 'assert';
import { isObject } from 'lodash';
import { SOLANA_MAINNET_SCOPE, WINDOW_TITLES } from '../../../constants';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../testHelpers';
import { buildSolanaTestSpecificMock } from '../../../tests/solana/common-solana';
import { withFixtures } from '../../../helpers';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import SnapTransactionConfirmation from '../../../page-objects/pages/confirmations/snap-transaction-confirmation';
import SnapSignInConfirmation from '../../../page-objects/pages/confirmations/snap-sign-in-confirmation';

describe('Multichain API - Non EVM', function () {
  describe('Calling `wallet_invokeMethod`', function () {
    describe('signIn method', function () {
      it('Should match selected method to the expected confirmation UI', async function () {
        await withFixtures(
          {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            fixtures: new FixtureBuilderV2().build(),
            title: this.test?.fullTitle(),
          },
          async ({ driver, extensionId }) => {
            await loginWithBalanceValidation(driver);
            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([SOLANA_MAINNET_SCOPE]);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            await testDapp.invokeMethod({
              scope: SOLANA_MAINNET_SCOPE,
              method: 'signIn',
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const confirmation = new SnapSignInConfirmation(driver);
            await confirmation.checkPageIsLoaded();
            await confirmation.clickFooterConfirmButton();
          },
        );
      });
    });

    describe('signAndSendTransaction method', function () {
      it('Should match selected method to the expected confirmation UI', async function () {
        await withFixtures(
          {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            fixtures: new FixtureBuilderV2().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: buildSolanaTestSpecificMock({
              mockGetTransactionSuccess: true,
            }),
          },
          async ({ driver, extensionId }) => {
            await loginWithBalanceValidation(driver);
            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([SOLANA_MAINNET_SCOPE]);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const invokeMethod = 'signAndSendTransaction';

            await testDapp.invokeMethod({
              scope: SOLANA_MAINNET_SCOPE,
              method: invokeMethod,
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const confirmation = new SnapTransactionConfirmation(driver);
            await confirmation.checkPageIsLoaded();
            await confirmation.checkAccountIsDisplayed('Account 1');
            await confirmation.clickFooterConfirmButtonAndWaitForWindowToClose();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const transactionResult = await testDapp.getInvokeMethodResult({
              scope: SOLANA_MAINNET_SCOPE,
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
