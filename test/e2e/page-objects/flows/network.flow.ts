import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { Driver } from '../../webdriver/driver';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';
import NetworksPage from '../pages/networks/networks-page';

/**
 * Opens the network filter from the asset list and enables every network,
 * widening the asset list to all of them.
 *
 * @param driver - The webdriver instance.
 */
export const selectAllNetworksFromNetworkSelect = async (driver: Driver) => {
  console.log('Selecting all networks');
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.selectAllNetworks();
};

/**
 * Opens the network filter from the asset list, navigates to the networks page
 * and deletes the given network, then returns to the asset list.
 *
 * @param driver - The webdriver instance.
 * @param hexChainId - The hexadecimal chain id of the network to delete.
 */
export const deleteNetworkFromNetworkSelect = async (
  driver: Driver,
  hexChainId: `0x${string}`,
) => {
  console.log(`Deleting network: ${hexChainId}`);
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);
  const networksPage = new NetworksPage(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.clickManageNetworks();
  await networksPage.checkPageIsLoaded();
  // The networks page keys its list items by CAIP chain id.
  await networksPage.deleteNetwork(toEvmCaipChainId(hexChainId));
  await networksPage.clickCloseButton();
};

/**
 * Opens the network filter from the asset list and enables only the given
 * network, scoping the asset list to it.
 *
 * @param driver - The webdriver instance.
 * @param network - The display name of the network to switch to, or its CAIP
 * chain id, e.g. `eip155:1`.
 */
export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  network: string,
) => {
  console.log(`Switching to network: ${network}`);
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  if (network.startsWith('eip155:')) {
    await selectNetworkModal.selectNetworkByChainId(network);
  } else {
    await selectNetworkModal.selectNetworkByNameWithWait(network);
  }
};

export async function waitForNetworkModalBackdropToClear(
  driver: Driver,
): Promise<void> {
  await driver.assertElementNotPresent('.modal__backdrop');
}
