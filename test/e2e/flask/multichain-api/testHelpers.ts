import * as path from 'path';
import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import {
  KnownRpcMethods,
  KnownNotifications,
  NormalizedScopeObject,
} from '@metamask/multichain';
import {
  DAPP_URL,
  largeDelayMs,
  openDapp,
  regularDelayMs,
  unlockWallet,
  WINDOW_TITLES,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

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
 * Initiates a request to wallet extension to create session for the passed scopes.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @param scopes - scopes to create session for.
 */
export async function initCreateSessionScopes(
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
}

/**
 * Confirms wallet operation and switches focus to multichain test dapp
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 */
export async function confirmAndSwitchFocusToDapp(
  driver: Driver,
): Promise<void> {
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
): Promise<{ sessionScopes: Record<string, NormalizedScopeObject> }> {
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
 * Use dapp UI to send custom addresses to request scope for.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @param accounts - The addresses to get session scope for.
 */
export async function addRequestAccountsToCreateSession(
  driver: Driver,
  accounts: [string, string],
): Promise<void> {
  const label = await driver.findElement({
    tag: 'label',
    text: 'Address',
  });
  const addressInput0 = await driver.findNestedElement(
    label,
    'input[type=text]',
  );

  // @ts-expect-error Driver.findNestedElement injects `fill` method onto returned element, but typescript compiler will not let us access this method without a complaint, so we override it.
  addressInput0.fill(accounts[0]);
  await driver.clickElement({ text: '+', tag: 'button' });
  await driver.delay(largeDelayMs);

  const allLabels = await driver.findElements({
    tag: 'label',
    text: 'Address',
  });

  const addressInput1 = await driver.findNestedElement(
    allLabels[1],
    'input[type=text]',
  );

  // @ts-expect-error refer above comment
  addressInput1.fill(accounts[1]);
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

export const addAndAuthorizeAccount = async (driver: Driver): Promise<void> => {
  const editButtons = await driver.findElements('[data-testid="edit"]');
  await editButtons[0].click();
  await driver.clickElement({ text: 'New account', tag: 'button' });
  await driver.clickElement({ text: 'Add account', tag: 'button' });
  await driver.delay(regularDelayMs);

  /**
   * this needs to be called again, as previous element is stale and will not be found in current frame
   */
  const freshEditButtons = await driver.findElements('[data-testid="edit"]');
  await freshEditButtons[0].click();
  await driver.delay(regularDelayMs);

  const checkboxes = await driver.findElements('input[type="checkbox" i]');
  await checkboxes[0].click(); // select all checkbox
  await driver.delay(regularDelayMs);

  await driver.clickElement({ text: 'Update', tag: 'button' });
};

/**
 * Deselect all networks but Ethereum Mainnet through extension UI.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 */
export const uncheckNetworksExceptMainnet = async (
  driver: Driver,
): Promise<void> => {
  const editButtons = await driver.findElements('[data-testid="edit"]');
  await editButtons[1].click();
  await driver.delay(regularDelayMs);

  const networkListItems = await driver.findElements(
    '.multichain-network-list-item',
  );

  for (const item of networkListItems) {
    const network = await item.getText();
    const checkbox = await item.findElement(By.css('input[type="checkbox"]'));
    const isChecked = await checkbox.isSelected();

    // we make sure to uncheck every other previously selected network other than Ethereum Mainnet
    if (isChecked && !network.includes('Ethereum Mainnet')) {
      await checkbox.click();
      await driver.delay(regularDelayMs);
    }
  }
  await driver.clickElement({ text: 'Update', tag: 'button' });
};

/**
 * Will assert only the requested networks are selected, and all other are not.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @param networkList - list of networks to assert selection for.
 */
export const assertOnlyRequestedNetworksAreSelected = async (
  driver: Driver,
  networkList: string[],
) => {
  const networkListItems = await driver.findElements(
    '.multichain-network-list-item',
  );

  for (const item of networkListItems) {
    const network = await item.getText();
    const checkbox = await item.findElement(By.css('input[type="checkbox"]'));
    const isChecked = await checkbox.isSelected();

    if (networkList.includes(network)) {
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
};
