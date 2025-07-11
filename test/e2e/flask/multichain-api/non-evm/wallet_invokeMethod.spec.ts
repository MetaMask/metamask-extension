import { strict as assert } from 'assert';
import { isObject } from 'lodash';
import { largeDelayMs, WINDOW_TITLES } from '../../../helpers';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  replaceColon,
} from '../testHelpers';
import { withSolanaAccountSnap } from '../../../tests/solana/common-solana';

describe('Multichain API - Non EVM', function () {
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

            const expectedAccount = 'Solana 1';

            await driver.waitForSelector({
              text: 'Sign-in request',
              tag: 'h2',
            });

            await driver.waitForSelector({
              tesId: 'snap-ui-address',
              text: expectedAccount,
            });

            const confirmButton = await driver.waitForSelector({
              testId: 'confirm-sign-in-confirm-snap-footer-button',
              text: 'Confirm',
            });

            await confirmButton.click();
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
            await driver.clickElementSafe(
              `[data-testid="${replaceColon(
                SOLANA_SCOPE,
              )}-${invokeMethod}-option"]`,
            );

            await driver.delay(largeDelayMs);

            await driver.clickElementSafe(
              `[data-testid="invoke-method-${replaceColon(SOLANA_SCOPE)}-btn"]`,
            );

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const expectedAccount = 'Solana 1';

            await driver.waitForSelector({
              text: 'Transaction request',
              tag: 'h2',
            });

            await driver.waitForSelector({
              tesId: 'snap-ui-address',
              text: expectedAccount,
            });

            const confirmButton = await driver.waitForSelector({
              testId:
                'confirm-sign-and-send-transaction-confirm-snap-footer-button',
              text: 'Confirm',
            });

            await driver.delay(largeDelayMs);

            await confirmButton.click();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const resultWebElement = await driver.findElement(
              `#invoke-method-${replaceColon(
                SOLANA_SCOPE,
              )}-${invokeMethod}-result-0`,
            );
            const parsedTransactionResult = JSON.parse(
              await resultWebElement.getText(),
            );

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
