import { Driver } from '../../webdriver/driver';

const networksToggle = '[data-testid="sort-by-networks"]';

export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  await driver.clickElement(networksToggle);
  await driver.clickElement({ text: networkCategory });
  await driver.clickElement(`[data-testid="${networkName}"]`);
};

export const switchToEditRPCViaGlobalMenuNetworks = async (driver: Driver) => {
  await driver.waitForSelector('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="global-menu-networks"]');
};
