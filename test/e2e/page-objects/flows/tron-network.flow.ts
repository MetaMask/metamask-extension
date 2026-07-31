import { Driver } from '../../webdriver/driver';
import NetworkManager from '../pages/network-manager';

/**
 * Selects the Tron network from the Network Manager Popular tab and waits for
 * any leftover modal backdrop to clear so subsequent clicks are not blocked.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab('Popular');
  await networkManager.selectNetworkByNameWithWait('Tron');

  // Network Manager close transitions can leave an orphan backdrop that blocks
  // Selenium clicks even after the modal itself has gone away.
  await driver.assertElementNotPresent('.modal__backdrop');
}
