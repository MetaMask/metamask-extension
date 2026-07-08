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
  const homePage = new HomePage(driver);
  const nonEvmNetworks = ['Bitcoin', 'Solana', 'Tron'];
  if (nonEvmNetworks.includes(networkName)) {
    // Wait for snap accounts to be ready before switching networks, to prevent race conditions
    await homePage.waitForNonEvmAccountsLoaded();
  }
  await networkManager.openNetworkManager();

  await tokensTab.openNetworksFilter();
  await networkManager.selectTab(networkCategory);
  await networkManager.selectNetworkByNameWithWait(networkName);
};

export const switchToEditRPCViaGlobalMenuNetworks = async (driver: Driver) => {
  await driver.waitForSelector('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="global-menu-networks"]');
};
