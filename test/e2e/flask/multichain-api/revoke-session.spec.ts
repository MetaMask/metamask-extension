import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  initCreateSessionScopes,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  addAccountInWalletAndAuthorize,
  getSessionScopes,
} from './testHelpers';

describe('Initializing a session w/ several scopes and accounts, then calling `wallet_revokeSession`', function () {
  const GANACHE_SCOPES = ['eip155:1337', 'eip155:1338', 'eip155:1000'];
  const ACCOUNTS = [ACCOUNT_1, ACCOUNT_2];
  it('Should receive empty object if `wallet_getSession` is called afterwards', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleGanache()
          .build(),
        ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
      },
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        await openMultichainDappAndConnectWalletWithExternallyConnectable(
          driver,
          extensionId,
        );
        await initCreateSessionScopes(driver, GANACHE_SCOPES, ACCOUNTS);
        await addAccountInWalletAndAuthorize(driver);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.delay(largeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);

        await driver.clickElement({
          text: 'wallet_revokeSession',
          tag: 'span',
        });

        const parsedResult = await getSessionScopes(driver);
        const resultSessionScopes = parsedResult.sessionScopes;
        assert.deepStrictEqual(
          resultSessionScopes,
          {},
          'Should receive an empty session scope after calling `wallet_getSession`',
        );
      },
    );
  });

  it('Should throw an error if `wallet_invokeMethod` is called afterwards', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleGanache()
          .build(),
        ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
      },
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        await openMultichainDappAndConnectWalletWithExternallyConnectable(
          driver,
          extensionId,
        );
        await initCreateSessionScopes(driver, GANACHE_SCOPES, ACCOUNTS);
        await addAccountInWalletAndAuthorize(driver);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.delay(largeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);

        await driver.clickElement({
          text: 'wallet_revokeSession',
          tag: 'span',
        });

        for (const scope of GANACHE_SCOPES) {
          const invokeMethodRequest = JSON.stringify({
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

          /**
           * We call `executeScript` to attempt JSON rpc call directly through the injected provider object since when session is revoked,
           * webapp does not provide UI to make call.
           */
          const result = await driver
            .executeScript(
              `return window.ethereum.request(${invokeMethodRequest})`,
            )
            .catch((err) => {
              return err;
            });

          assert.strictEqual(
            result instanceof Error,
            true,
            `calling wallet_invokeMethod should throw an error for scope ${scope}`,
          );
        }
      },
    );
  });
});
