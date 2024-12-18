import * as path from 'path';
import {
  DAPP_URL,
  largeDelayMs,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { KnownRpcMethods, KnownNotifications } from '@metamask/multichain';

/**
 * Default options for setting up Multichain E2E test environment
 */
export const DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS = {
  dapp: true,
  dappPaths: [
    path.join(
      '..',
      '..',
      'node_modules',
      '@metamask',
      'test-dapp-multichain',
      'build',
    ),
  ],
};

/**
 * Unlocks a wallet and provides extension id for dapp to connect to wallet extension.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @param extensionId - Extension identifier for web dapp to interact with wallet extension.
 */
export async function openMultichainDappAndConnectWalletWithExternallyConnectable(
  driver: Driver,
  extensionId: string,
): Promise<void> {
  await unlockWallet(driver);
  await openDapp(driver, undefined, DAPP_URL);

  await driver.fill('[placeholder="Enter extension ID"]', extensionId);
  await driver.clickElement({ text: 'Connect', tag: 'button' });
  await driver.delay(largeDelayMs);
}

/**
 * Sends a request to wallet extension to create session for the passed scopes.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @param scopes - scopes to create session for.
 */
export async function createSessionScopes(
  driver: Driver,
  scopes: string[],
): Promise<void> {
  for (const scope of scopes) {
    await driver.clickElement(`input[name="${scope}"]`);
  }

  await driver.clickElement({ text: 'wallet_createSession', tag: 'span' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(largeDelayMs);

  const editButtons = await driver.findElements('[data-testid="edit"]');
  await editButtons[1].click();
  await driver.delay(largeDelayMs);

  await driver.clickElement('[data-testid="connect-more-chains-button"]');
  await driver.clickElement({ text: 'Connect', tag: 'button' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
}

/**
 * Retrieves permitted session scopes by using test driver to interact with web dapp.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @returns result containing sessions scopes.
 */
export async function getSessionScopes(
  driver: Driver,
): Promise<{ sessionScopes: Record<string, unknown> }> {
  await driver.clickElement({ text: 'wallet_getSession', tag: 'span' });

  const completeResultSummary = await driver.findElements('.result-summary');

  const getSessionResultSummary = completeResultSummary[0];
  await getSessionResultSummary.click();
  const getSessionRawResult = await driver.findElement(
    '#session-method-result-0',
  );

  return JSON.parse(await getSessionRawResult.getText());
}

/**
 * Retrieves the expected session scope for a given set of addresses.
 *
 * @param scope - The session scope.
 * @param accounts - The addresses to get session scope for.
 * @returns the expected session scope.
 */
export const getExpectedSessionScope = (scope: string, accounts: string[]) => ({
  methods: KnownRpcMethods.eip155,
  notifications: KnownNotifications.eip155,
  accounts: accounts.map((acc) => `${scope}:${acc.toLowerCase()}`),
});
