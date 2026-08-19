import { Driver } from '../../webdriver/driver';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';
import {
  switchToNetworkFromNetworkSelect,
  waitForNetworkModalBackdropToClear,
} from './network.flow';

/**
 * Opens the home network filter and selects a network by display name, then
 * waits for any leftover modal to close so subsequent clicks are not blocked.
 *
 * @param driver - WebDriver instance
 * @param networkName - Display name of the network row, e.g. `Tron`
 */
async function selectNetworkFromFilter(
  driver: Driver,
  networkName: string,
): Promise<void> {
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.selectNetworkByNameWithWait(networkName);
  await selectNetworkModal.closeIfOpen();
}

/**
 * Selects Tron for live-balance flows (send, derivation, assets).
 *
 * Uses {@link switchToNetworkFromNetworkSelect} so the shared Snap-ready delay
 * runs before Tron is enabled. AssetsController only fetches Snap balances for
 * newly enabled chains; a too-early enable leaves the token list at 0 TRX.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  await waitForNetworkModalBackdropToClear(driver);
}

/**
 * Selects Tron for mocked activity assertions.
 *
 * Waits until the Tron Snap and BIP44 account exist, then uses the delay-free
 * filter path. Activity tests mock transaction history and do not need the
 * live-balance Snap delay used by {@link selectTronNetwork}.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetworkForActivity(
  driver: Driver,
): Promise<void> {
  const homePage = new NonEvmHomepage(driver);
  await homePage.waitForTronAccountToBeReady();
  await homePage.dismissVisibleToast();
  await selectNetworkFromFilter(driver, 'Tron');
}
