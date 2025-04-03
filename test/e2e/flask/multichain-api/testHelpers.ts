import * as path from 'path';
import { By } from 'selenium-webdriver';
import { KnownRpcMethods, KnownNotifications } from '@metamask/multichain';
import {
  convertETHToHexGwei,
  multipleGanacheOptions,
  PRIVATE_KEY,
  regularDelayMs,
  WINDOW_TITLES,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC } from '../../constants';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

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
  localNodeOptions: [
    {
      type: 'ganache',
      options: {
        secretKey: PRIVATE_KEY,
        balance: convertETHToHexGwei(DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC),
        accounts: multipleGanacheOptions.accounts,
      },
    },
    {
      type: 'ganache',
      options: {
        port: 8546,
        chainId: 1338,
        accounts: multipleGanacheOptions.accounts,
      },
    },
    {
      type: 'ganache',
      options: {
        port: 7777,
        chainId: 1000,
        accounts: multipleGanacheOptions.accounts,
      },
    },
  ],
};

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

/**
 * Password locks user's metamask extension.
 *
 * @param driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 */
export const passwordLockMetamaskExtension = async (
  driver: Driver,
): Promise<void> => {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElementSafe('[data-testid="account-options-menu-button"]');
  await driver.clickElementSafe('[data-testid="global-menu-lock"]');
};

/**
 * Sometimes we need to escape colon character when using {@link Driver.findElement}, otherwise selenium will treat this as an invalid selector.
 *
 * @param selector - string to manipulate.
 * @returns string with escaped colon char.
 */
export const escapeColon = (selector: string): string =>
  selector.replace(':', '\\:');

/**
 * Wraps a describe call in a skip call if the SELENIUM_BROWSER environment variable is not the specified browser.
 *
 * @param browser - The browser environment of the current test, against which to conditionally run or skip the test.
 * @param description - The description of the test suite.
 * @param callback - The callback function to execute the test suite.
 */
export const describeBrowserOnly = (
  browser: string,
  description: string,
  callback: () => void,
) => {
  return process.env.SELENIUM_BROWSER === browser
    ? describe(description, callback)
    : describe.skip(description, callback);
};
