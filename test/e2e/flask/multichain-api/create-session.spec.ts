import { strict as assert } from 'assert';
import { largeDelayMs, WINDOW_TITLES, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import {
  confirmAndSwitchFocusToDapp,
  initCreateSessionScopes,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  getExpectedSessionScope,
  addRequestAccountsToCreateSession,
  assertOnlyRequestedNetworksAreSelected,
  addAndAuthorizeAccount,
  uncheckNetworksExceptMainnet,
} from './testHelpers';

describe('Multichain API', function () {
  /**
   * check {@link FixtureBuilder.withPreferencesControllerAdditionalAccountIdentities} for second injected account address.
   */
  const SECOND_INJECTED_ACCOUNT = '0x09781764c08de8ca82e156bbf156a3ca217c7950';

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
          await initCreateSessionScopes(driver, [
            'eip155:1',
            ...scopesToIgnore,
          ]);
          await confirmAndSwitchFocusToDapp(driver);
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

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` with requested EVM scope that match the user’s enabled networks', function () {
    it('should only select the specified EVM scopes requested by the user, and session scope contain valid accounts only', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder().withPopularNetworks().build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({
          driver,
          extensionId,
        }: {
          driver: Driver;
          extensionId: string;
        }) => {
          const INVALID_ACCOUNT = '0x9999999999999999999999999999999999999999';
          const requestScopesToNetworkMap = {
            'eip155:1': 'Ethereum Mainnet',
            'eip155:42161': 'Arbitrum One',
            'eip155:10': 'OP Mainnet',
          };

          const requestScopes = Object.keys(requestScopesToNetworkMap);
          const networksToRequest = Object.values(requestScopesToNetworkMap);

          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );

          await addRequestAccountsToCreateSession(driver, [
            DEFAULT_FIXTURE_ACCOUNT,
            INVALID_ACCOUNT,
          ]);

          await initCreateSessionScopes(driver, requestScopes);

          // navigate to network selection screen
          const editButtons = await driver.findElements('[data-testid="edit"]');
          await editButtons[1].click();
          await driver.delay(largeDelayMs);

          await assertOnlyRequestedNetworksAreSelected(
            driver,
            networksToRequest,
          );

          // proceed with network selection confirm
          await driver.clickElement(
            '[data-testid="connect-more-chains-button"]',
          );
          await confirmAndSwitchFocusToDapp(driver);

          const getSessionScopesResult = await getSessionScopes(driver);
          for (const scope of requestScopes) {
            /**
             * Accounts in scope should not include invalid account {@link INVALID_ACCOUNT}, only the valid accounts.
             */
            const expectedSessionScope = getExpectedSessionScope(scope, [
              DEFAULT_FIXTURE_ACCOUNT,
            ]);
            const result = getSessionScopesResult.sessionScopes[scope].accounts;

            assert.deepEqual(
              expectedSessionScope.accounts,
              result,
              `${expectedSessionScope.accounts} does not match accounts in scope ${result}`,
            );
          }
        },
      );
    });
  });

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` with requested EVM scope that match the user’s enabled networks, edit selection in wallet UI', function () {
    it('should change result according to changed network & accounts', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withPopularNetworks()
            .withPreferencesControllerAdditionalAccountIdentities()
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
          const requestScopesToNetworkMap = {
            'eip155:1': 'Ethereum Mainnet',
            'eip155:10': 'OP Mainnet',
          };

          const requestScopes = Object.keys(requestScopesToNetworkMap);

          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );

          await addRequestAccountsToCreateSession(driver, [
            DEFAULT_FIXTURE_ACCOUNT,
            '',
          ]);
          await initCreateSessionScopes(driver, requestScopes);

          await addAndAuthorizeAccount(driver);
          await uncheckNetworksExceptMainnet(driver);

          await driver.clickElement({ text: 'Connect', tag: 'button' });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          const getSessionScopesResult = await getSessionScopes(driver);

          assert.strictEqual(
            getSessionScopesResult.sessionScopes['eip155:10'],
            undefined,
          );

          assert.ok(getSessionScopesResult.sessionScopes['eip155:1']);

          assert.deepEqual(
            getSessionScopesResult.sessionScopes['eip155:1'].accounts,
            getExpectedSessionScope('eip155:1', [
              DEFAULT_FIXTURE_ACCOUNT,
              SECOND_INJECTED_ACCOUNT,
            ]).accounts,
            `Should add account ${SECOND_INJECTED_ACCOUNT} to scope`,
          );
        },
      );
    });
  });
});
