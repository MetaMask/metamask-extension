import { Driver } from '../../webdriver/driver';
import NetworkManager from '../pages/network-manager';
import { clearOrphanedNetworkManagerBackdrop } from './network.flow';

export async function selectTronNetwork(driver: Driver): Promise<void> {
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab('Popular');
  await networkManager.selectNetworkByNameWithWait('Tron');

  // Network Manager close transitions can leave an orphan backdrop that blocks
  // Selenium clicks even after the modal itself has gone away.
  await clearOrphanedNetworkManagerBackdrop(driver);
}
