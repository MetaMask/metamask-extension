import { Driver } from '../../webdriver/driver';
import AssetListPage from '../pages/home/asset-list';
import HomePage from '../pages/home/homepage';
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
  const homePage = new HomePage(driver);

  await homePage.waitForNonEvmAccountsLoaded();
  await assetListPage.openNetworksFilter();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectNetworkByNameWithWait(networkName);
};
