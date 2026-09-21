import { strict as assert } from 'assert';
import { pick } from 'lodash';
import { ACCOUNT_1, ACCOUNT_2, WINDOW_TITLES } from '../../../constants';
import { toEvmCaipAccountId } from '../../../../../shared/lib/multichain/scope-utils';
import { withFixtures } from '../../../helpers';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsPage from '../../../page-objects/pages/permission/edit-connected-accounts-page';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { login } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  sendMultichainApiRequest,
  type FixtureCallbackArgs,
} from '../testHelpers';

/**
 * `revokeSession()` only clicks the revoke button; wait until
 * `wallet_getSession` returns empty scopes so revoke has finished
 * before calling `wallet_invokeMethod`. Each `getSession` poll adds a
 * result row, so increment `numberOfResultItems` on every attempt.
 *
 * Newest session-method row is prepended. If revoke resolves after
 * getSession but before we read, index 0 can be `true` instead of
 * a sessionScopes object — treat that as "not ready" and retry.
 *
 * @param driver - The E2E test Driver instance.
 * @param testDapp - The multichain test dapp page object.
 */
async function waitForEmptySessionAfterRevoke(
  driver: Driver,
  testDapp: TestDappMultichain,
): Promise<void> {
  let numberOfResultItems = 3; // create + revoke + getSession
  await driver.waitUntil(
    async () => {
      try {
        const result = await testDapp.getSession({
          numberOfResultItems,
        });
        const sessionScopes = result?.sessionScopes;
        return (
          typeof sessionScopes === 'object' &&
          sessionScopes !== null &&
          Object.keys(sessionScopes).length === 0
        );
      } catch {
        return false;
      } finally {
        numberOfResultItems += 1;
      }
    },
    { timeout: 10000, interval: 1000 },
  );
}

describe('Initializing a session w/ several scopes and accounts, then calling `wallet_revokeSession`', function () {
  const EVM_SCOPES = ['eip155:1337', 'eip155:1338', 'eip155:1000'];
  const CAIP_ACCOUNT_IDS = [
    toEvmCaipAccountId(ACCOUNT_1),
    toEvmCaipAccountId(ACCOUNT_2),
  ];
  it('Should return empty object from `wallet_getSession` call', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerTripleNode()
          .build(),
        ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
      },
      async ({ driver, extensionId }: FixtureCallbackArgs) => {
        await login(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes(EVM_SCOPES, CAIP_ACCOUNT_IDS);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.openEditAccountsModal();

        const editConnectedAccountsPage = new EditConnectedAccountsPage(driver);
        await editConnectedAccountsPage.checkPageIsLoaded();
        await editConnectedAccountsPage.addNewAccount();

        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        await testDapp.checkPageIsLoaded();

        /**
         * We verify that scopes are not empty before calling `wallet_revokeSession`
         */
        const { sessionScopes } = await testDapp.getSession();
        assert.ok(
          Object.keys(sessionScopes).length > 0,
          'Should have non-empty session scopes value before calling `wallet_revokeSession`',
        );

        await testDapp.revokeSession();

        const parsedResult = await testDapp.getSession({
          numberOfResultItems: 3,
        });
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
        fixtures: new FixtureBuilderV2()
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

        await login(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);

        await testDapp.initCreateSessionScopes(EVM_SCOPES, CAIP_ACCOUNT_IDS);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.openEditAccountsModal();

        const editConnectedAccountsPage = new EditConnectedAccountsPage(driver);
        await editConnectedAccountsPage.checkPageIsLoaded();
        await editConnectedAccountsPage.addNewAccount();

        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        await testDapp.checkPageIsLoaded();

        await testDapp.revokeSession();
        await waitForEmptySessionAfterRevoke(driver, testDapp);

        for (const scope of EVM_SCOPES) {
          const request = {
            jsonrpc: '2.0' as const,
            method: 'wallet_invokeMethod',
            params: {
              scope,
              request: {
                method: 'eth_getBalance',
                params: [ACCOUNT_1, 'latest'],
              },
            },
          };

          /**
           * We call `executeScript` to attempt JSON rpc call directly through the injected provider object since when session is revoked,
           * webapp does not provide UI to make `wallet_invokeMethod` calls when no session is active.
           */
          const result = await sendMultichainApiRequest({
            driver,
            extensionId,
            request,
          });

          /**
           * We make sure it's the expected error by comparing expected error code and message (we ignore `stack` property)
           */
          assert.deepEqual(
            pick(result.error, ['code', 'message']),
            expectedError,
            `calling wallet_invokeMethod should throw an error for scope ${scope}`,
          );
        }
      },
    );
  });
});
