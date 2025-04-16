import { strict as assert } from 'assert';
import { pick } from 'lodash';
import { Browser } from 'selenium-webdriver';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import TestDappMultichain from '../../page-objects/pages/test-dapp-multichain';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  addAccountInWalletAndAuthorize,
  type FixtureCallbackArgs,
  describeBrowserOnly,
} from './testHelpers';

describeBrowserOnly(
  Browser.CHROME,
  'Initializing a session w/ several scopes and accounts, then calling `wallet_revokeSession`',
  function () {
    const GANACHE_SCOPES = ['eip155:1337', 'eip155:1338', 'eip155:1000'];
    const ACCOUNTS = [ACCOUNT_1, ACCOUNT_2];
    it('Should return empty object from `wallet_getSession` call', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleNode()
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          await unlockWallet(driver);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes(GANACHE_SCOPES, ACCOUNTS);
          await addAccountInWalletAndAuthorize(driver);
          await driver.clickElement({ text: 'Connect', tag: 'button' });
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          /**
           * We verify that scopes are not empty before calling `wallet_revokeSession`
           */
          const { sessionScopes } = await testDapp.getSession();
          assert.ok(
            Object.keys(sessionScopes).length > 0,
            'Should have non-empty session scopes value before calling `wallet_revokeSession`',
          );

          await driver.clickElement({
            text: 'wallet_revokeSession',
            tag: 'span',
          });

          const parsedResult = await testDapp.getSession();
          const resultSessionScopes = parsedResult.sessionScopes;
          assert.deepStrictEqual(
            resultSessionScopes,
            {},
            'Should receive an empty session scopes value after calling `wallet_revokeSession`',
          );
        },
      );
    });

    it('Should throw an error if `wallet_invokeMethod` is called afterwards', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleNode()
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          const expectedError = {
            code: 4100,
            message:
              'The requested account and/or method has not been authorized by the user.',
          };

          await unlockWallet(driver);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.connectExternallyConnectable(extensionId);

          await testDapp.initCreateSessionScopes(GANACHE_SCOPES, ACCOUNTS);
          await addAccountInWalletAndAuthorize(driver);
          await driver.clickElement({ text: 'Connect', tag: 'button' });
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          await driver.clickElement({
            text: 'wallet_revokeSession',
            tag: 'span',
          });

          for (const scope of GANACHE_SCOPES) {
            const id = 1999133338649204;
            const data = JSON.stringify({
              id,
              jsonrpc: '2.0',
              method: 'wallet_invokeMethod',
              params: {
                scope,
                request: {
                  method: 'eth_getBalance',
                  params: [ACCOUNT_1, 'latest'],
                },
              },
            });

            const script = `
            const port = chrome.runtime.connect('${extensionId}');
            const data = ${data};
            const result = new Promise((resolve) => {
              port.onMessage.addListener((msg) => {
                if (msg.type !== 'caip-348') {
                  return;
                }
                if (msg.data?.id !== ${id}) {
                  return;
                }

                if (msg.data.id || msg.data.error) {
                  resolve(msg)
                }
              })
            })
            port.postMessage({ type: 'caip-348', data });
            return result;`;

            /**
             * We call `executeScript` to attempt JSON rpc call directly through the injected provider object since when session is revoked,
             * webapp does not provide UI to make call.
             */
            const actualError = await driver
              .executeScript(script)
              .then((res) => res.data?.error);

            /**
             * We make sure it's the expected error by comparing expected error code and message (we ignore `stack` property)
             */
            assert.deepEqual(
              expectedError,
              pick(
                actualError,
                ['code', 'message'],
                `calling wallet_invokeMethod should throw an error for scope ${scope}`,
              ),
            );
          }
        },
      );
    });
  },
);
