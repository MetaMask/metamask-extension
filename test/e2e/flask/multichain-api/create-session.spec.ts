import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { largeDelayMs, WINDOW_TITLES, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import {
  initCreateSessionScopes,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  getExpectedSessionScope,
  addAccountsToCreateSessionForm,
  addAccountInWalletAndAuthorize,
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
            .withPopularNetworks()
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
          const REQUEST_SCOPE = 'eip155:1';
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

          await addAccountsToCreateSessionForm(driver, [
            SECOND_ACCOUNT_IN_WALLET,
            ACCOUNT_NOT_IN_WALLET,
          ]);

          await initCreateSessionScopes(driver, [REQUEST_SCOPE]);

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
          'eip155:42161': 'Arbitrum One',
          'eip155:10': 'OP Mainnet',
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

            await addAccountsToCreateSessionForm(driver, [
              DEFAULT_FIXTURE_ACCOUNT,
              '',
            ]);
            await initCreateSessionScopes(driver, requestScopes);

            await addAccountInWalletAndAuthorize(driver);
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

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` without any accounts requested', function () {
    it('should automatically select the current active account', async function () {
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
          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );

          await initCreateSessionScopes(driver, ['eip155:1']);

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
              getExpectedSessionScope('eip155:1', [
                DEFAULT_FIXTURE_ACCOUNT,
                SECOND_INJECTED_ACCOUNT,
              ]).accounts,
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
            await openMultichainDappAndConnectWalletWithExternallyConnectable(
              driver,
              extensionId,
            );

            await initCreateSessionScopes(driver, ['eip155:1']);

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
});
