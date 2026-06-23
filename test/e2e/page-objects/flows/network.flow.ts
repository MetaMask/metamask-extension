import { Driver } from '../../webdriver/driver';
import TokensTab from '../pages/home/tokens-tab';
import NetworkManager from '../pages/network-manager';

export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  console.log(
    `Switching to network: ${networkName} in category: ${networkCategory}`,
  );
  const tokensTab = new TokensTab(driver);
  const networkManager = new NetworkManager(driver);

  await tokensTab.openNetworksFilter();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectNetworkByNameWithWait(networkName);
};

export const checkNetworkIsListedInNetworkManager = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  const networkManager = new NetworkManager(driver);

  await networkManager.openNetworkManager();
  await networkManager.selectTab(networkCategory);
  await networkManager.checkNetworkIsListed(networkName);
};
