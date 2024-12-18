import _ from 'lodash';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import {
  DEFAULT_OPTIONS,
  getExpectedSessionScope,
  getSessionScopes,
  openDappAndConnectWallet,
} from './testHelpers';

describe('Multichain API', function () {
  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_getSession` when there is no existing session', function () {
    it('should successfully receive empty session scopes', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder().withPopularNetworks().build(),
          ...DEFAULT_OPTIONS,
        },
        async ({
          driver,
          extensionId,
        }: {
          driver: Driver;
          extensionId: string;
        }) => {
          await openDappAndConnectWallet(driver, extensionId);
          const parsedResult = await getSessionScopes(driver);

          if (!_.isEqual(parsedResult.sessionScopes, {})) {
            throw new Error('Should receive empty session scopes');
          }
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
          ...DEFAULT_OPTIONS,
        },
        async ({
          driver,
          extensionId,
        }: {
          driver: Driver;
          extensionId: string;
        }) => {
          /**
           * check {@link FixtureBuilder.withPermissionControllerConnectedToTestDapp} for default scopes returned
           */
          const DEFAULT_SCOPE = 'eip155:1337';

          await openDappAndConnectWallet(driver, extensionId);
          const parsedResult = await getSessionScopes(driver);

          const sessionScope = parsedResult.sessionScopes[DEFAULT_SCOPE];
          const expectedSessionScope = getExpectedSessionScope(DEFAULT_SCOPE, [
            DEFAULT_FIXTURE_ACCOUNT,
          ]);

          if (!_.isEqual(sessionScope, expectedSessionScope)) {
            throw new Error(
              `Should receive result that specifies expected session scopes for ${DEFAULT_SCOPE}`,
            );
          }
        },
      );
    });
  });
});
