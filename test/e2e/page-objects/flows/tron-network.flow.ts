import { Driver } from '../../webdriver/driver';
import NetworkManager from '../pages/network-manager';

export async function selectTronNetwork(driver: Driver): Promise<void> {
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab('Popular');
  await networkManager.selectNetworkByNameWithWait('Tron');
}
