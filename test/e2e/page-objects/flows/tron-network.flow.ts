import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import TokensTab from '../pages/home/tokens-tab';
import NetworkManager from '../pages/network-manager';

/**
 * Selects the Tron network from the Network Manager Popular tab and waits for
 * any leftover modal backdrop to clear so subsequent clicks are not blocked.
 *
 * The flow coordinates homepage readiness and toast handling, the tokens-tab
 * network filter, and network-manager selection/closure.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);
  const tokensTab = new TokensTab(driver);
  const networkManager = new NetworkManager(driver);

  await homePage.waitForTronAccountToBeReady();
  await homePage.dismissVisibleToast();
  await tokensTab.openNetworksFilter();
  await networkManager.selectTab('Popular');
  await networkManager.selectNetworkByNameWithWait('Tron');
  await networkManager.closeNetworkManagerIfOpen();
}
