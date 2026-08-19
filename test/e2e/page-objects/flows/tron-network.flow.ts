import { Driver } from '../../webdriver/driver';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';

const TRON_NATIVE_TOKEN_FIRST_WAIT_MS = 5_000;
const TRON_NATIVE_TOKEN_RETRY_WAIT_MS = 20_000;

/**
 * Opens the home network filter and selects Tron, then waits for any leftover
 * modal to close so subsequent clicks are not blocked.
 *
 * @param networkFilter - Home network filter page object
 * @param selectNetworkModal - Network selection modal page object
 */
async function selectTronFromNetworkFilter(
  networkFilter: NetworkFilter,
  selectNetworkModal: SelectNetworkModal,
): Promise<void> {
  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.selectNetworkByNameWithWait('Tron');
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
 * If the first switch happens before the Snap is ready to handle it, the
 * balance-fetch trigger is missed and nothing re-fetches afterwards. Switching
 * away and back retriggers that fetch without a fixed delay.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  const homePage = new NonEvmHomepage(driver);
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await homePage.waitForTronAccountToBeReady();
  await homePage.dismissVisibleToast();
  await selectTronFromNetworkFilter(networkFilter, selectNetworkModal);

  try {
    await homePage.waitForTronNativeTokenToBeListed(
      TRON_NATIVE_TOKEN_FIRST_WAIT_MS,
    );
  } catch {
    console.log(
      'Tron native token did not appear after the first network select; switching away and back to retrigger the Snap balance fetch',
    );
    await networkFilter.open();
    await selectNetworkModal.checkPageIsLoaded();
    await selectNetworkModal.selectAllNetworks();
    await selectTronFromNetworkFilter(networkFilter, selectNetworkModal);
    await homePage.waitForTronNativeTokenToBeListed(
      TRON_NATIVE_TOKEN_RETRY_WAIT_MS,
    );
  }
}
