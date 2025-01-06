import * as path from 'path';
import { By } from 'selenium-webdriver';
import {
  KnownRpcMethods,
  KnownNotifications,
  NormalizedScopeObject,
} from '@metamask/multichain';
import {
  DAPP_URL,
  defaultGanacheOptions,
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
 * Options for setting up three ganache instances
 */
export const MULTIPLE_GANACHE_OPTIONS = {
  dappOptions: { numberOfDapps: 2 },
  ganacheOptions: {
    ...defaultGanacheOptions,
    concurrent: [
      {
        port: 8546,
        chainId: 1338,
        ganacheOptions2: defaultGanacheOptions,
      },
      {
        port: 7777,
        chainId: 1000,
        ganacheOptions2: defaultGanacheOptions,
      },
    ],
  },
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
 * @param accounts - The account addresses to create session for.
 */
export async function initCreateSessionScopes(
  driver: Driver,
  scopes: string[],
  accounts: string[] = [],
): Promise<void> {
  for (const [i, scope] of scopes.entries()) {
    const scopeInput = await driver.waitForSelector(`#custom-Scope-input-${i}`);

    // @ts-expect-error Driver.findNestedElement injects `fill` method onto returned element, but typescript compiler will not let us access this method without a complaint, so we override it.
    scopeInput.fill(scope);
    await driver.clickElement(`#add-custom-scope-button-${i}`);
  }

  for (const [i, account] of accounts.entries()) {
    const accountInput = await driver.waitForSelector(
      `#custom-Address-input-${i}`,
    );

    // @ts-expect-error Driver.findNestedElement injects `fill` method onto returned element, but typescript compiler will not let us access this method without a complaint, so we override it.
    accountInput.fill(account);
    await driver.clickElement(`#add-custom-address-button-${i}`);
  }

  await driver.clickElement({ text: 'wallet_createSession', tag: 'span' });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(largeDelayMs);
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

export const addAccountInWalletAndAuthorize = async (
  driver: Driver,
): Promise<void> => {
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
 * Update Multichain network edit form so that only matching networks are selected.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @param selectedNetworkNames
 */
export const updateNetworkCheckboxes = async (
  driver: Driver,
  selectedNetworkNames: string[],
): Promise<void> => {
  const editButtons = await driver.findElements('[data-testid="edit"]');
  await editButtons[1].click();
  await driver.delay(regularDelayMs);

  const networkListItems = await driver.findElements(
    '.multichain-network-list-item',
  );

  for (const item of networkListItems) {
    const networkName = await item.getText();
    const checkbox = await item.findElement(By.css('input[type="checkbox"]'));
    const isChecked = await checkbox.isSelected();

    const isSelectedNetwork = selectedNetworkNames.some((selectedNetworkName) =>
      networkName.includes(selectedNetworkName),
    );

    const shouldNotBeChecked = isChecked && !isSelectedNetwork;
    const shouldBeChecked = !isChecked && isSelectedNetwork;

    if (shouldNotBeChecked || shouldBeChecked) {
      await checkbox.click();
      await driver.delay(regularDelayMs);
    }
  }
  await driver.clickElement({ text: 'Update', tag: 'button' });
};
