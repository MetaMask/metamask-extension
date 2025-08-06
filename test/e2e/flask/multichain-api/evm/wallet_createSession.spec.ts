import { strict as assert } from 'assert';
import { isObject } from 'lodash';
import {
  WINDOW_TITLES,
  withFixtures,
  ACCOUNT_1,
  ACCOUNT_2,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import EditConnectedAccountsModal from '../../../page-objects/pages/dialog/edit-connected-accounts-modal';
import HomePage from '../../../page-objects/pages/home/homepage';
import NetworkPermissionSelectModal from '../../../page-objects/pages/dialog/network-permission-select-modal';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../../page-objects/flows/login.flow';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
  type FixtureCallbackArgs,
} from '../testHelpers';

describe('Multichain API', function () {
  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` with requested EVM scope that does NOT match one of the users enabled networks', function () {
    it("the specified EVM scopes that do not match the user's configured networks should be treated as if they were not requested", async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          const scopesToIgnore = ['eip155:1338', 'eip155:1000'];

          await loginWithBalanceValidation(driver);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes([
            'eip155:1337',
            ...scopesToIgnore,
          ]);

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.confirmConnect();

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );
          await testDapp.checkPageIsLoaded();
          const getSessionResult = await testDapp.getSession();

          for (const scope of scopesToIgnore) {
            assert.strictEqual(
              getSessionResult.sessionScopes[scope],
              undefined,
            );
          }
        },
      );
    });
  });

  describe("Call `wallet_createSession` with EVM scopes that match the user's enabled networks, and eip155 scoped accounts", function () {
    it('should ignore requested accounts that do not match accounts in the wallet and and pre-select matching requested accounts in the permission confirmation screen', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleNode()
            .withTrezorAccount()
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          const REQUEST_SCOPE = 'eip155:1337';
          /**
           * check {@link FixtureBuilder.withTrezorAccount} for second injected account address.
           */
          const SECOND_ACCOUNT_IN_WALLET =
            '0xf68464152d7289d7ea9a2bec2e0035c45188223c';
          const ACCOUNT_NOT_IN_WALLET =
            '0x9999999999999999999999999999999999999999';

          await loginWithoutBalanceValidation(driver);
          await new HomePage(driver).checkExpectedBalanceIsDisplayed('0');

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes(
            [REQUEST_SCOPE],
            [SECOND_ACCOUNT_IN_WALLET, ACCOUNT_NOT_IN_WALLET],
          );

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.confirmConnect();

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );
          await testDapp.checkPageIsLoaded();
          const getSessionResult = await testDapp.getSession();
          /**
           * Accounts in scope should not include invalid account {@link ACCOUNT_NOT_IN_WALLET}, only the valid accounts.
           */
          const expectedSessionScope = getExpectedSessionScope(REQUEST_SCOPE, [
            SECOND_ACCOUNT_IN_WALLET,
          ]);
          const result = getSessionResult.sessionScopes[REQUEST_SCOPE].accounts;

          assert.deepEqual(
            expectedSessionScope.accounts,
            result,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `${expectedSessionScope.accounts} does not match accounts in scope ${result}`,
          );
        },
      );
    });
  });

  it('should only select the specified EVM scopes requested by the user', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder().withPopularNetworks().build(),
        ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
      },
      async ({ driver, extensionId }: FixtureCallbackArgs) => {
        const requestScopesToNetworkMap = {
          'eip155:1': 'Ethereum Mainnet',
          'eip155:59141': 'Linea Sepolia',
        };
        const requestScopes = Object.keys(requestScopesToNetworkMap);
        const networksToRequest = Object.values(requestScopesToNetworkMap);

        await loginWithBalanceValidation(driver);
        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes(requestScopes);

        // navigate to network selection screen
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.goToPermissionsTab();
        await connectAccountConfirmation.openEditNetworksModal();

        const networkPermissionSelectModal = new NetworkPermissionSelectModal(
          driver,
        );
        await networkPermissionSelectModal.checkPageIsLoaded();
        await networkPermissionSelectModal.checkNetworkStatus(
          networksToRequest,
        );
      },
    );
  });

  describe('Call `wallet_createSession`', function () {
    describe("With requested EVM scope that match the user's enabled networks, edit selection in wallet UI", function () {
      it('should change result according to changed network & accounts', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleNode()
              .withPreferencesControllerAdditionalAccountIdentities()
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
              ['eip155:1337', 'eip155:1338'],
              [ACCOUNT_1],
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
            await editConnectedAccountsModal.addNewEthereumAccount();

            await connectAccountConfirmation.checkPageIsLoaded();
            await connectAccountConfirmation.goToPermissionsTab();
            await connectAccountConfirmation.openEditNetworksModal();

            const networkPermissionSelectModal =
              new NetworkPermissionSelectModal(driver);
            await networkPermissionSelectModal.checkPageIsLoaded();
            await networkPermissionSelectModal.updateNetworkStatus([
              'Localhost 8545',
            ]);
            await networkPermissionSelectModal.clickConfirmEditButton();

            await connectAccountConfirmation.checkPageIsLoaded();
            await connectAccountConfirmation.confirmConnect();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();
            const getSessionResult = await testDapp.getSession();

            assert.strictEqual(
              getSessionResult.sessionScopes['eip155:1338'],
              undefined,
            );

            assert.ok(getSessionResult.sessionScopes['eip155:1337']);

            assert.deepEqual(
              getSessionResult.sessionScopes['eip155:1337'].accounts,
              getExpectedSessionScope('eip155:1337', [ACCOUNT_1, ACCOUNT_2])
                .accounts,
              `Should add account ${ACCOUNT_2} to scope`,
            );
          },
        );
      });
    });
  });

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` without any accounts requested', function () {
    it('should automatically select the current active account', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder().build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          await loginWithBalanceValidation(driver);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes(['eip155:1337']);

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.openEditAccountsModal();

          const editConnectedAccountsModal = new EditConnectedAccountsModal(
            driver,
          );
          await editConnectedAccountsModal.checkPageIsLoaded();

          const isAccountSelected =
            await editConnectedAccountsModal.checkIsAccountSelected(1);
          assert.strictEqual(
            isAccountSelected,
            true,
            'current active account in the wallet should be automatically selected',
          );
        },
      );
    });
  });

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession`, choose to edit accounts and', function () {
    describe('add a new one', function () {
      it('dApp should receive a response that includes permissions for the accounts that were selected for sharing', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleNode()
              .withEnabledNetworks({
                eip155: {
                  '0x539': true,
                },
              })
              .withPreferencesControllerAdditionalAccountIdentities()
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(['eip155:1']);

            const connectAccountConfirmation = new ConnectAccountConfirmation(
              driver,
            );
            await connectAccountConfirmation.checkPageIsLoaded();
            await connectAccountConfirmation.openEditAccountsModal();

            const editConnectedAccountsModal = new EditConnectedAccountsModal(
              driver,
            );
            await editConnectedAccountsModal.checkPageIsLoaded();
            await editConnectedAccountsModal.addNewEthereumAccount();

            await connectAccountConfirmation.checkPageIsLoaded();
            await connectAccountConfirmation.confirmConnect();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();
            const getSessionResult = await testDapp.getSession();

            assert.deepEqual(
              getSessionResult.sessionScopes['eip155:1'].accounts,
              getExpectedSessionScope('eip155:1', [ACCOUNT_1, ACCOUNT_2])
                .accounts,
              'The dapp should receive a response that includes permissions for the accounts that were selected for sharing',
            );
          },
        );
      });
    });

    describe('deselect all', function () {
      it('should not be able to approve the create session request without at least one account selected', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withEnabledNetworks({
                eip155: {
                  '0x539': true,
                },
              })
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(['eip155:1337']);

            const connectAccountConfirmation = new ConnectAccountConfirmation(
              driver,
            );
            await connectAccountConfirmation.checkPageIsLoaded();
            await connectAccountConfirmation.openEditAccountsModal();

            const editConnectedAccountsModal = new EditConnectedAccountsModal(
              driver,
            );
            await editConnectedAccountsModal.checkPageIsLoaded();
            await editConnectedAccountsModal.selectAccount(1);
            await editConnectedAccountsModal.disconnectAccount();

            await connectAccountConfirmation.checkPageIsLoaded();
            assert.strictEqual(
              await connectAccountConfirmation.isConfirmButtonEnabled(),
              false,
              'should not able to approve the create session request without at least one account should be selected',
            );
          },
        );
      });
    });
  });

  describe('Dapp has existing session with 2 scopes and 1 account and then calls `wallet_createSession` with different scopes and accounts', function () {
    const OLD_SCOPES = ['eip155:1337', 'eip155:1'];
    const NEW_SCOPES = ['eip155:1338', 'eip155:1000'];
    const TREZOR_ACCOUNT = '0xf68464152d7289d7ea9a2bec2e0035c45188223c';

    it('should include old session permissions as pre-selected in the connection screen along with those requested in the new `wallet_createSession` request', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleNode()
            .withPermissionControllerConnectedToMultichainTestDappWithTwoAccounts(
              {
                scopes: OLD_SCOPES,
              },
            )
            .withTrezorAccount()
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          await loginWithoutBalanceValidation(driver);
          new HomePage(driver).checkExpectedBalanceIsDisplayed('0');

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);

          /**
           * We first make sure sessions exist
           */
          const existinggetSessionResult = await testDapp.getSession();
          OLD_SCOPES.forEach((scope) =>
            assert.strictEqual(
              isObject(existinggetSessionResult.sessionScopes[scope]),
              true,
              `scope ${scope} should exist`,
            ),
          );

          /**
           * Then we make sure to deselect the existing session scopes, and create session with new scopes
           */
          OLD_SCOPES.forEach(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            async (scope) =>
              await driver.clickElement(`input[name="${scope}"]`),
          );
          await testDapp.initCreateSessionScopes(NEW_SCOPES, [
            `eip155:0:${TREZOR_ACCOUNT}`,
          ]);

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.confirmConnect();

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );
          await testDapp.checkPageIsLoaded();

          const newgetSessionResult = await testDapp.getSession();

          const expectedNewSessionScopes = [...OLD_SCOPES, ...NEW_SCOPES].map(
            (scope) => ({
              [scope]: getExpectedSessionScope(scope, [
                ACCOUNT_1,
                TREZOR_ACCOUNT,
              ]),
            }),
          );

          for (const expectedSessionScope of expectedNewSessionScopes) {
            const [scopeName] = Object.keys(expectedSessionScope);
            const expectedScopeObject = expectedSessionScope[scopeName];
            const resultSessionScope =
              newgetSessionResult.sessionScopes[scopeName];

            assert.deepEqual(
              expectedScopeObject,
              resultSessionScope,
              `${scopeName} does not match expected scope`,
            );

            const resultAccounts = resultSessionScope.accounts;
            assert.deepEqual(
              expectedScopeObject.accounts,
              resultAccounts,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              `${expectedScopeObject.accounts} do not match accounts in scope ${scopeName}`,
            );
          }
        },
      );
    });
  });
});
