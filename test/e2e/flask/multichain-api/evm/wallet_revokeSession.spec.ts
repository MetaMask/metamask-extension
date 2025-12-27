import { strict as assert } from 'assert';
import { pick } from 'lodash';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../../helpers';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import EditConnectedAccountsModal from '../../../page-objects/pages/dialog/edit-connected-accounts-modal';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  sendMultichainApiRequest,
  type FixtureCallbackArgs,
} from '../testHelpers';

describe('Initializing a session w/ several scopes and accounts, then calling `wallet_revokeSession`', function () {
  const GANACHE_SCOPES = ['eip155:1337', 'eip155:1338', 'eip155:1000'];
  const CAIP_ACCOUNT_IDS = [`eip155:0:${ACCOUNT_1}`, `eip155:0:${ACCOUNT_2}`];
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
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes(
          GANACHE_SCOPES,
          CAIP_ACCOUNT_IDS,
        );

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.openEditAccountsModal();

        const editConnectedAccountsModal = new EditConnectedAccountsModal(
          driver,
        );
        await editConnectedAccountsModal.checkPageIsLoaded();
        await editConnectedAccountsModal.addNewAccount();

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

        await loginWithBalanceValidation(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);

        await testDapp.initCreateSessionScopes(
          GANACHE_SCOPES,
          CAIP_ACCOUNT_IDS,
        );
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.openEditAccountsModal();

        const editConnectedAccountsModal = new EditConnectedAccountsModal(
          driver,
        );
        await editConnectedAccountsModal.checkPageIsLoaded();
        await editConnectedAccountsModal.addNewAccount();

        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        await testDapp.checkPageIsLoaded();

        await testDapp.revokeSession();
        await driver.delay(largeDelayMs);

        for (const scope of GANACHE_SCOPES) {
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
