import * as path from 'path';
import { DAPP_URL, largeDelayMs, openDapp, unlockWallet } from '../../helpers';
import { Driver } from '../../webdriver/driver';

/**
 * Default options for setting up Multichain E2E test environment
 */
export const DEFAULT_OPTIONS = {
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
 * @param {Driver} driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
 * @param extensionId - Extension identifier for web dapp to interact with wallet extension.
 */
export async function openDappAndConnectWallet(
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
 * Retrieves permitted session scopes by using test driver to interact with web dapp.
 *
 * @param {Driver} driver - E2E test driver {@link Driver}, wrapping the Selenium WebDriver.
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
 * @param {string} scope - The session scope.
 * @param {string[]} accounts - The addresses to get session scope for.
 * @returns the expected session scope.
 */
export const getExpectedSessionScope = (scope: string, accounts: string[]) => ({
  methods: [
    'personal_sign',
    'eth_signTypedData_v4',
    'wallet_watchAsset',
    'eth_sendTransaction',
    'eth_decrypt',
    'eth_getEncryptionPublicKey',
    'web3_clientVersion',
    'eth_subscribe',
    'eth_unsubscribe',
    'eth_blockNumber',
    'eth_call',
    'eth_chainId',
    'eth_estimateGas',
    'eth_feeHistory',
    'eth_gasPrice',
    'eth_getBalance',
    'eth_getBlockByHash',
    'eth_getBlockByNumber',
    'eth_getBlockTransactionCountByHash',
    'eth_getBlockTransactionCountByNumber',
    'eth_getCode',
    'eth_getFilterChanges',
    'eth_getFilterLogs',
    'eth_getLogs',
    'eth_getProof',
    'eth_getStorageAt',
    'eth_getTransactionByBlockHashAndIndex',
    'eth_getTransactionByBlockNumberAndIndex',
    'eth_getTransactionByHash',
    'eth_getTransactionCount',
    'eth_getTransactionReceipt',
    'eth_getUncleCountByBlockHash',
    'eth_getUncleCountByBlockNumber',
    'eth_newBlockFilter',
    'eth_newFilter',
    'eth_newPendingTransactionFilter',
    'eth_sendRawTransaction',
    'eth_syncing',
    'eth_uninstallFilter',
  ],
  notifications: ['eth_subscription'],
  accounts: accounts.map((acc) => `${scope}:${acc.toLowerCase()}`),
});
