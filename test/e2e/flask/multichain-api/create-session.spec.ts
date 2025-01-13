import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import {
  largeDelayMs,
  WINDOW_TITLES,
  withFixtures,
  ACCOUNT_1,
  ACCOUNT_2,
  veryLargeDelayMs,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  initCreateSessionScopes,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  getExpectedSessionScope,
  addAccountInWalletAndAuthorize,
  updateNetworkCheckboxes,
} from './testHelpers';
import { A } from '@storybook/components';

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
          const scopesToIgnore = ['eip155:1338', 'eip155:1000'];
          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );
          await initCreateSessionScopes(driver, [
            'eip155:1337',
            ...scopesToIgnore,
          ]);

          await driver.clickElement({ text: 'Connect', tag: 'button' });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

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

  describe('Call `wallet_createSession` with EVM scopes that match the user’s enabled networks, and eip155 scoped accounts', function () {
    it('should ignore requested accounts that do not match accounts in the wallet and and pre-select matching requested accounts in the permission confirmation screen', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withTrezorAccount()
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
          const REQUEST_SCOPE = 'eip155:1337';
          /**
           * check {@link FixtureBuilder.withTrezorAccount} for second injected account address.
           */
          const SECOND_ACCOUNT_IN_WALLET =
            '0xf68464152d7289d7ea9a2bec2e0035c45188223c';
          const ACCOUNT_NOT_IN_WALLET =
            '0x9999999999999999999999999999999999999999';

          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );

          await initCreateSessionScopes(
            driver,
            [REQUEST_SCOPE],
            [SECOND_ACCOUNT_IN_WALLET, ACCOUNT_NOT_IN_WALLET],
          );

          await driver.clickElement({ text: 'Connect', tag: 'button' });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          const getSessionScopesResult = await getSessionScopes(driver);
          /**
           * Accounts in scope should not include invalid account {@link ACCOUNT_NOT_IN_WALLET}, only the valid accounts.
           */
          const expectedSessionScope = getExpectedSessionScope(REQUEST_SCOPE, [
            SECOND_ACCOUNT_IN_WALLET,
          ]);
          const result =
            getSessionScopesResult.sessionScopes[REQUEST_SCOPE].accounts;

          assert.deepEqual(
            expectedSessionScope.accounts,
            result,
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
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        const requestScopesToNetworkMap = {
          'eip155:1': 'Ethereum Mainnet',
          'eip155:59141': 'Linea Sepolia',
        };

        const requestScopes = Object.keys(requestScopesToNetworkMap);
        const networksToRequest = Object.values(requestScopesToNetworkMap);

        await openMultichainDappAndConnectWalletWithExternallyConnectable(
          driver,
          extensionId,
        );

        await initCreateSessionScopes(driver, requestScopes);

        // navigate to network selection screen
        const editButtons = await driver.findElements('[data-testid="edit"]');
        await editButtons[1].click();
        await driver.delay(largeDelayMs);

        const networkListItems = await driver.findElements(
          '.multichain-network-list-item',
        );

        for (const item of networkListItems) {
          const network = await item.getText();
          const checkbox = await item.findElement(
            By.css('input[type="checkbox"]'),
          );
          const isChecked = await checkbox.isSelected();

          if (networksToRequest.includes(network)) {
            assert.strictEqual(
              isChecked,
              true,
              `Expected ${network} to be selected.`,
            );
          } else {
            assert.strictEqual(
              isChecked,
              false,
              `Expected ${network} to NOT be selected.`,
            );
          }
        }
      },
    );
  });

  describe('Call `wallet_createSession`', function () {
    describe('With requested EVM scope that match the user’s enabled networks, edit selection in wallet UI', function () {
      it('should change result according to changed network & accounts', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleGanache()
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
            await openMultichainDappAndConnectWalletWithExternallyConnectable(
              driver,
              extensionId,
            );

            await initCreateSessionScopes(
              driver,
              ['eip155:1337', 'eip155:1338'],
              [ACCOUNT_1],
            );

            await addAccountInWalletAndAuthorize(driver);
            await updateNetworkCheckboxes(driver, ['Localhost 8545']);

            await driver.clickElement({ text: 'Connect', tag: 'button' });
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const getSessionScopesResult = await getSessionScopes(driver);

            assert.strictEqual(
              getSessionScopesResult.sessionScopes['eip155:1338'],
              undefined,
            );

            assert.ok(getSessionScopesResult.sessionScopes['eip155:1337']);

            assert.deepEqual(
              getSessionScopesResult.sessionScopes['eip155:1337'].accounts,
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

          await initCreateSessionScopes(driver, ['eip155:1337']);

          const editButtons = await driver.findElements('[data-testid="edit"]');
          await editButtons[0].click();

          const checkboxes = await driver.findElements(
            'input[type="checkbox" i]',
          );
          const accountCheckbox = checkboxes[1];
          const isChecked = await accountCheckbox.isSelected();

          assert.strictEqual(
            isChecked,
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
              .withNetworkControllerTripleGanache()
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
            await openMultichainDappAndConnectWalletWithExternallyConnectable(
              driver,
              extensionId,
            );

            await initCreateSessionScopes(driver, ['eip155:1']);

            await addAccountInWalletAndAuthorize(driver);

            await driver.clickElement({ text: 'Connect', tag: 'button' });
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const getSessionScopesResult = await getSessionScopes(driver);

            assert.deepEqual(
              getSessionScopesResult.sessionScopes['eip155:1'].accounts,
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
            fixtures: new FixtureBuilder().build(),
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

            await initCreateSessionScopes(driver, ['eip155:1337']);

            const editButtons = await driver.findElements(
              '[data-testid="edit"]',
            );
            await editButtons[0].click();

            const checkboxes = await driver.findElements(
              'input[type="checkbox" i]',
            );
            const selectAllCheckbox = checkboxes[0];

            await selectAllCheckbox.click();
            await driver.clickElement({ text: 'Disconnect', tag: 'button' });

            const confirmButton = await driver.findElement(
              '[data-testid="confirm-btn"]',
            );
            const isEnabled = await confirmButton.isEnabled();

            assert.strictEqual(
              isEnabled,
              false,
              'should not able to approve the create session request without at least one account should be selected',
            );
          },
        );
      });
    });
  });

  describe(`Dapp has existing session with scope eip155:1337, and accounts ${ACCOUNT_1} & ${ACCOUNT_2}, call 'wallet_createSession' with scopes eip:155:1338 & eip:155:1000, and account 0xf68464152d7289d7ea9a2bec2e0035c45188223c`, function () {
    const OLD_SCOPE = 'eip155:1337';
    const NEW_SCOPES = ['eip155:1338', 'eip155:1000'];
    const TREZOR_ACCOUNT = '0xf68464152d7289d7ea9a2bec2e0035c45188223c';

    it.only('should entirely overwrite old session permissions by those requested in the new `wallet_createSession` request', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPermissionControllerConnectedToTestDappWithTwoAccounts({
              isMultichainOrigin: true,
            })
            .withTrezorAccount()
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

          /**
           * We make sure to deselect the existing session scope
           */
          await driver.clickElement(`input[name="${OLD_SCOPE}"]`);

          await initCreateSessionScopes(driver, NEW_SCOPES, [TREZOR_ACCOUNT]);
          await driver.clickElement({ text: 'Connect', tag: 'button' });
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          const getSessionScopesResult = await getSessionScopes(driver);

          assert.strictEqual(
            getSessionScopesResult.sessionScopes[OLD_SCOPE],
            undefined,
          );

          const expectedSessionScopes = NEW_SCOPES.map((scope) => {
            return {
              [scope]: getExpectedSessionScope(scope, [TREZOR_ACCOUNT]), // TODO: simplify syntax
            };
          });

          for (const expectedSessionScope of expectedSessionScopes) {
            const [scopeName, expectedScopeObject] =
              Object.entries(expectedSessionScope)[0]; // TODO: simplify this shit
            const resultSessionScope =
              getSessionScopesResult.sessionScopes[scopeName];
            console.log({ resultSessionScope, scopeName, expectedScopeObject });
            assert.deepEqual(
              resultSessionScope,
              expectedScopeObject,
              `${scopeName} does not match expected scope`,
            );

            const resultAccounts = resultSessionScope.accounts;
            assert.deepEqual(
              resultAccounts,
              expectedScopeObject.accounts,
              `${expectedScopeObject.accounts} do not match accounts in scope ${scopeName}`,
            );
          }
        },
      );
    });
  });
});
