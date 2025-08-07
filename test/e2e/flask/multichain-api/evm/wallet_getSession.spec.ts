import { strict as assert } from 'assert';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
  type FixtureCallbackArgs,
} from '../testHelpers';

describe('Multichain API', function () {
  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_getSession` when there is no existing session', function () {
    it('should successfully receive empty session scopes', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder().withPopularNetworks().build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          const parsedResult = await testDapp.getSession();

          assert.deepStrictEqual(
            parsedResult.sessionScopes,
            {},
            'Should receive empty session scopes',
          );
        },
      );
    });
  });

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_getSession` when there is an existing session', function () {
    it('should successfully receive result that specifies its permitted session scopes for selected chains', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withPopularNetworks()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          /**
           * check {@link FixtureBuilder.withPermissionControllerConnectedToTestDapp} for default scopes returned
           */
          const DEFAULT_SCOPE = 'eip155:1337';

          await loginWithBalanceValidation(driver);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          const parsedResult = await testDapp.getSession();

          const sessionScope = parsedResult.sessionScopes[DEFAULT_SCOPE];
          const expectedSessionScope = getExpectedSessionScope(DEFAULT_SCOPE, [
            DEFAULT_FIXTURE_ACCOUNT,
          ]);

          assert.deepStrictEqual(
            sessionScope,
            expectedSessionScope,
            `Should receive result that specifies expected session scopes for ${DEFAULT_SCOPE}`,
          );
        },
      );
    });
  });
});
