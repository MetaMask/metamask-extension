import { Driver } from '../../webdriver/driver';
import TokensTab from '../pages/home/tokens-tab';
import NetworkManager from '../pages/network-manager';

// TODO: Replace this fixed delay with a deterministic wait. Non-EVM accounts (Tron, Bitcoin) are created
// asynchronously at runtime via BIP44 stage-2 alignment, and the Snap only kicks
// off its balance fetch when the network is switched while it is fully ready. If
// we switch too early, that trigger is missed and nothing re-fetches the balance
// afterwards.
// Solana is intentionally excluded as it's seeded in the fixtures vault
const NON_EVM_SNAP_READY_DELAY_MS = 10_000;
const NON_EVM_NETWORKS_NEEDING_DELAY = ['Tron', 'Bitcoin'];

/**
 * Opens the network filter from the asset list and enables every network in the
 * given category, widening the asset list to all of them.
 *
 * @param driver - The webdriver instance.
 * @param networkCategory - The tab to select all networks from.
 */
export const selectAllNetworksFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string = 'Popular',
) => {
  console.log(`Selecting all networks in category: ${networkCategory}`);
  const tokensTab = new TokensTab(driver);
  const networkManager = new NetworkManager(driver);

  await tokensTab.openNetworksFilter();
  await networkManager.checkPageIsLoaded();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectAllNetworks();
};

/**
 * Opens the network filter from the asset list and enables only the given
 * network, scoping the asset list to it. Prefer
 * `switchToNetworkFromNetworkSelect` unless the caller has already waited for
 * the network's Snap to be ready.
 *
 * @param driver - The webdriver instance.
 * @param networkCategory - The tab the network is listed under.
 * @param networkName - The display name of the network to select.
 */
export const selectOnlyNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  console.log(
    `Selecting only network: ${networkName} in category: ${networkCategory}`,
  );
  const tokensTab = new TokensTab(driver);
  const networkManager = new NetworkManager(driver);

  await tokensTab.openNetworksFilter();
  await networkManager.checkPageIsLoaded();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectNetworkByNameWithWait(networkName);
};

export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  console.log(
    `Switching to network: ${networkName} in category: ${networkCategory}`,
  );

  if (NON_EVM_NETWORKS_NEEDING_DELAY.includes(networkName)) {
    await driver.delay(NON_EVM_SNAP_READY_DELAY_MS);
  }

  await selectOnlyNetworkFromNetworkSelect(
    driver,
    networkCategory,
    networkName,
  );
};

export async function waitForNetworkManagerBackdropToClear(
  driver: Driver,
): Promise<void> {
  await driver.assertElementNotPresent('.modal__backdrop');
}
