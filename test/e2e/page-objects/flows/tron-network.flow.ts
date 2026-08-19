import { Driver } from '../../webdriver/driver';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';

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
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await homePage.waitForTronAccountToBeReady();
  await homePage.dismissVisibleToast();
  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.selectNetworkByNameWithWait('Tron');
  await selectNetworkModal.closeIfOpen();
}
