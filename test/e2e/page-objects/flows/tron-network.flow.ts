import { Driver } from '../../webdriver/driver';
import {
  switchToNetworkFromNetworkSelect,
  waitForNetworkModalBackdropToClear,
} from './network.flow';

/**
 * Selects the Tron network from the Network Manager and waits for any leftover
 * modal backdrop to clear so subsequent clicks are not blocked.
 *
 * Uses {@link switchToNetworkFromNetworkSelect} so the BIP44/Snap ready delay
 * runs before the switch — without it, Tron balance fetches never start.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  await waitForNetworkModalBackdropToClear(driver);
}
