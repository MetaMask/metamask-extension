import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  veryLargeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  addAccountInWalletAndAuthorize,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
  getSessionScopes,
  initCreateSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  updateNetworkCheckboxes,
} from './testHelpers';

describe('Call `wallet_createSession`, then update the accounts and/or scopes in the permissions page of the wallet for that dapp', function () {
  const SCOPES = ['eip155:1337', 'eip155:1338'];
  const ACCOUNTS = [ACCOUNT_1, ACCOUNT_2];
  it('should receive a `wallet_sessionChanged` event with the full new session scopes', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleGanache()
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

        await initCreateSessionScopes(driver, SCOPES, ACCOUNTS);

        await addAccountInWalletAndAuthorize(driver);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.delay(largeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);

        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

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
        const secondAccountCheckbox = checkboxes[1];
        await secondAccountCheckbox.click();

        await driver.clickElementSafe({ text: 'Update', tag: 'button' });

        /* // TODO: add code to also update scopes
        const freshEditButtons = await driver.findElements('[data-testid="edit"]');
        await freshEditButtons[1].click();
        */

        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);

        const walletSessionChangedNotificationWebElement =
          await driver.findElement('#wallet-session-changed-result-0'); // TODO: sometimes this event fires twice, with recent having updated accounts, sometimes once, with both accounts instead of just one. Investigate

        const resultSummaries = await driver.findElements('.result-summary');

        /**
         * Currently we don't have `data-testid` setup for the desired result, so we click on all available results
         * to make the complete text available and later evaluate if scopes match.
         */
        resultSummaries.forEach(async (element) => await element.click());


        const parsedNotificationResult = JSON.parse(
          await walletSessionChangedNotificationWebElement.getText(),
        );

        const expectedScope = getExpectedSessionScope(SCOPES[0], [ACCOUNT_1]);

        const sessionChangedScope =
          parsedNotificationResult.params.sessionScopes;

        const currentScope = sessionChangedScope[SCOPES[0]];
        const scopedAccounts = currentScope.accounts;

        assert.deepEqual(
          currentScope,
          expectedScope,
          `scope ${SCOPES[0]} should be present in 'wallet_sessionChanged' event data`,
        );

        assert.deepEqual(
          scopedAccounts,
          expectedScope.accounts,
          `${expectedScope.accounts} does not match accounts in scope ${currentScope}`,
        );

        // TODO: uncomment when we add code to also update the scopes
        assert.deepEqual(
          sessionChangedScope[SCOPES[1]],
          undefined,
          `scope ${SCOPES[1]} should NOT be present in 'wallet_sessionChanged' event data`,
        );

        assert.deepEqual(true, false, 'make proper assertion');
      },
    );
  });
});
