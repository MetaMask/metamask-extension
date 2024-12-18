import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  createSessionScopes,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
} from './testHelpers';

describe('Multichain API', function () {
  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` with requested EVM scope that does NOT match one of the user’s enabled networks', function () {
    it("the specified EVM scopes that do not match the user's configured networks should be treated as if they were not requested", async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
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
          const scopesToIgnore = ['eip155:42161', 'eip155:10'];
          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );
          await createSessionScopes(driver, ['eip155:1', ...scopesToIgnore]);

          const getSessionScopesResult = await getSessionScopes(driver);

          for (const scope of scopesToIgnore) {
            assert.strictEqual(
              getSessionScopesResult.sessionScopes[scope],
              undefined,
            );
          }
        },
      );
    });
  });
});
