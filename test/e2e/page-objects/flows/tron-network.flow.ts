import { Driver } from '../../webdriver/driver';
import { switchToNetworkFromNetworkSelect } from './network.flow';

export async function selectTronNetwork(driver: Driver): Promise<void> {
  await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');
}
