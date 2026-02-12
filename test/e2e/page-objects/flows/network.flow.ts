import { Driver } from '../../webdriver/driver';
import NetworkManager from '../pages/network-manager';

export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  const networkManager = new NetworkManager(driver);
  await networkManager.openNetworkManager();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectNetworkByNameWithWait(networkName);
};

export const switchToEditRPCViaGlobalMenuNetworks = async (driver: Driver) => {
  await driver.waitForSelector('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="global-menu-networks"]');
};
