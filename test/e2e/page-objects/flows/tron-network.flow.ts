import { Driver } from '../../webdriver/driver';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';

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
 * Waits for BIP44 stage-2 Tron account alignment and dismisses homepage toasts
 * before opening the picker, instead of the shared Snap ready delay, so
 * activity tests stay within CI shard limits.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  const homePage = new NonEvmHomepage(driver);

  await homePage.waitForTronAccountToBeReady();
  await homePage.dismissVisibleToast();
  await selectNetworkFromFilter(driver, 'Tron');
}

/**
 * Disables Tron by selecting Ethereum, then selects Tron again.
 *
 * AssetsController only fetches Snap balances for *newly* enabled chains. If
 * the first Tron select happens before the Snap can answer `listAccountAssets`,
 * that fetch is skipped and later Tron-only filter clicks do not retry it
 * because Tron is already enabled. Switching to Ethereum removes Tron from
 * `enabledNetworkMap`; selecting Tron afterwards puts it in `addedChains`
 * again so the Snap balance fetch re-runs. Not a fixed delay.
 *
 * @param driver - WebDriver instance
 */
export async function retriggerTronNetworkSelect(
  driver: Driver,
): Promise<void> {
  console.log(
    'Switching from Tron to Ethereum and back so AssetsController re-fetches Snap balances',
  );
  await selectNetworkFromFilter(driver, 'Ethereum');
  await selectNetworkFromFilter(driver, 'Tron');
}
