import { Driver } from '../../webdriver/driver';
import AssetListPage from '../pages/home/asset-list';
import NetworkManager from '../pages/network-manager';

export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  console.log(
    `Switching to network: ${networkName} in category: ${networkCategory}`,
  );
  const assetListPage = new AssetListPage(driver);
  const networkManager = new NetworkManager(driver);

  await assetListPage.openNetworksFilter();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectNetworkByNameWithWait(networkName);
};
