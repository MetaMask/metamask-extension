import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import TestDappMultichain from '../../page-objects/pages/test-dapp-multichain';
import {
  addAccountInWalletAndAuthorize,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
  updateNetworkCheckboxes,
} from './testHelpers';

describe('Call `wallet_createSession`, then update the accounts and/or scopes in the permissions page of the wallet for that dapp', function () {
  const INITIAL_SCOPES = ['eip155:1337', 'eip155:1338'];
  const REMOVED_SCOPE = INITIAL_SCOPES[0];
  const UPDATED_SCOPE = INITIAL_SCOPES[1];

  const CAIP_ACCOUNT_IDS = [`eip155:0:${ACCOUNT_1}`, `eip155:0:${ACCOUNT_2}`];
  const UPDATED_ACCOUNT = ACCOUNT_2;
  it('should receive a `wallet_sessionChanged` event with the full new session scopes', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
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
        await unlockWallet(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes(
          INITIAL_SCOPES,
          CAIP_ACCOUNT_IDS,
        );
        await addAccountInWalletAndAuthorize(driver);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.delay(largeDelayMs);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        /**
         * We make sure to update selected accounts via wallet extension UI
         */
        await driver.clickElementSafe(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElementSafe(
          '[data-testid="global-menu-connected-sites"]',
        );
        await driver.clickElementSafe('[data-testid="connection-list-item"]');

        const editButtons = await driver.findElements('[data-testid="edit"]');
        await editButtons[0].click();
        const checkboxes = await driver.findElements(
          'input[type="checkbox" i]',
        );
        const firstAccountCheckbox = checkboxes[1];
        await firstAccountCheckbox.click();
        await driver.clickElementSafe({ text: 'Update', tag: 'button' });

        /**
         * And also update selected scope to {@link UPDATED_SCOPE}
         */
        await updateNetworkCheckboxes(driver, ['Localhost 8546']);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);

        const walletSessionChangedNotificationWebElement =
          await driver.findElement('#wallet-session-changed-result-0');

        const resultSummaries = await driver.findElements('.result-summary');
        await resultSummaries[1].click();

        const expectedScope = getExpectedSessionScope(UPDATED_SCOPE, [
          UPDATED_ACCOUNT,
        ]);

        const parsedNotificationResult = JSON.parse(
          await walletSessionChangedNotificationWebElement.getText(),
        );
        const sessionChangedScope =
          parsedNotificationResult.params.sessionScopes;

        const currentScope = sessionChangedScope[UPDATED_SCOPE];
        const scopedAccounts = currentScope.accounts;

        assert.deepEqual(
          currentScope,
          expectedScope,
          `scope ${UPDATED_SCOPE} should be present in 'wallet_sessionChanged' event data`,
        );

        assert.deepEqual(
          scopedAccounts,
          expectedScope.accounts,
          `${expectedScope.accounts} does not match accounts in scope ${currentScope}`,
        );

        assert.deepEqual(
          sessionChangedScope[REMOVED_SCOPE],
          undefined,
          `scope ${REMOVED_SCOPE} should NOT be present in 'wallet_sessionChanged' event data`,
        );
      },
    );
  });
});
