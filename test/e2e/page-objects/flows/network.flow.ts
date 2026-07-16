import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import TokensTab from '../pages/home/tokens-tab';
import NetworkManager from '../pages/network-manager';

/**
 * Waits until a non-EVM Snap has initialized and created its account in state.
 *
 * Non-EVM accounts are created asynchronously at runtime (BIP44 stage-2
 * alignment). Switching to a non-EVM network before its account exists means
 * the network switch never triggers a Snap balance fetch, leaving the balance
 * stuck at 0. Waiting for the account here makes the subsequent switch
 * deterministically kick off the balance fetch.
 *
 * @param driver - The WebDriver instance.
 * @param accountTypePrefix - The CAIP account type prefix to look for (e.g. `tron:`, `bip122:`).
 * @param timeout - Max ms to wait for the account to appear.
 */
const waitForNonEvmAccountReady = async (
  driver: Driver,
  accountTypePrefix: string,
  timeout: number = 10_000,
): Promise<void> => {
  console.log(
    `Waiting for Snap account of type "${accountTypePrefix}" to be created in state`,
  );
  await driver.waitUntil(
    async () => {
      const state = await getCleanAppState(driver);
      const accounts =
        state?.metamask?.internalAccounts?.accounts ??
        ({} as Record<string, { type?: string }>);
      return Object.values(accounts as Record<string, { type?: string }>).some(
        (account) => account?.type?.toLowerCase().startsWith(accountTypePrefix),
      );
    },
    { interval: 500, timeout },
  );
};

// Non-EVM networks whose Snap account is created asynchronously at runtime. We
// must wait for the account to exist before switching so the switch triggers the
// Snap balance fetch (otherwise the balance stays 0).
const NON_EVM_ACCOUNT_READY_WAITERS: Record<
  string,
  (driver: Driver) => Promise<void>
> = {
  Tron: (driver) => waitForNonEvmAccountReady(driver, 'tron:'),
  Bitcoin: (driver) => waitForNonEvmAccountReady(driver, 'bip122:'),
};

export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  console.log(
    `Switching to network: ${networkName} in category: ${networkCategory}`,
  );
  const tokensTab = new TokensTab(driver);
  const networkManager = new NetworkManager(driver);

  // For non-EVM networks, wait for the Snap account to exist before switching so
  // the switch triggers the Snap balance fetch; otherwise the balance stays 0.
  const waitForAccountReady = NON_EVM_ACCOUNT_READY_WAITERS[networkName];
  if (waitForAccountReady) {
    await waitForAccountReady(driver);
  }

  await tokensTab.openNetworksFilter();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectNetworkByNameWithWait(networkName);
};
