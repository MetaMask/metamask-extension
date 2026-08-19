import { Driver } from '../../webdriver/driver';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';
import { switchToNetworkFromNetworkSelect } from './network.flow';

export type SelectTronNetworkOptions = {
  /**
   * When true, uses {@link switchToNetworkFromNetworkSelect} so the shared
   * Snap-ready delay runs before Tron is enabled. Send flows need that delay:
   * AssetsController only fetches Snap balances for newly enabled chains, and
   * a too-early enable leaves the token list at 0 TRX. Activity tests omit it
   * because they assert mocked transactions, not live balances.
   *
   * Live-balance flows must not call {@link NonEvmHomepage.waitForTronAccountToBeReady}
   * first. Waiting for the Tron account/Snap can let BIP44 alignment enable
   * Tron before the Snap can answer balances, which skips the fetch.
   */
  waitForSnapReadyDelay?: boolean;
};

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
 * Selects the Tron network from the network filter modal and waits for any
 * leftover modal to close so subsequent clicks are not blocked.
 *
 * Activity and derivation wait for BIP44 stage-2 Tron account alignment, then
 * use the delay-free filter path. Send flows should pass `waitForSnapReadyDelay`
 * so the Snap is ready to start a balance fetch when Tron is enabled.
 *
 * @param driver - WebDriver instance
 * @param options - Optional Snap-ready delay for live-balance flows
 * @param options.waitForSnapReadyDelay
 */
export async function selectTronNetwork(
  driver: Driver,
  { waitForSnapReadyDelay = false }: SelectTronNetworkOptions = {},
): Promise<void> {
  const homePage = new NonEvmHomepage(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  if (waitForSnapReadyDelay) {
    await switchToNetworkFromNetworkSelect(driver, 'Tron');
    await selectNetworkModal.closeIfOpen();
    return;
  }

  await homePage.waitForTronAccountToBeReady();
  await homePage.dismissVisibleToast();
  await selectNetworkFromFilter(driver, 'Tron');
}
