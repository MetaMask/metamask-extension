import { Driver } from '../../webdriver/driver';
import {
  switchToNetworkFromNetworkSelect,
  waitForNetworkModalBackdropToClear,
} from './network.flow';

/**
 * Selects the Stellar network from the network filter and waits for any
 * leftover modal backdrop to clear so subsequent clicks are not blocked.
 *
 * Uses {@link switchToNetworkFromNetworkSelect} so the BIP44/Snap ready delay
 * runs before the switch — without it, Stellar balance fetches may never start.
 *
 * @param driver - WebDriver instance
 */
export async function selectStellarNetwork(driver: Driver): Promise<void> {
  await switchToNetworkFromNetworkSelect(driver, 'Stellar');
  await waitForNetworkModalBackdropToClear(driver);
}
