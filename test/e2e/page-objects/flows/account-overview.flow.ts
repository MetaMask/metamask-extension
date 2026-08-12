import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';

const accountMenuButton = '[data-testid="account-menu-icon"]';

const activityTabButton = '[data-testid="account-overview__activity-tab"]';

const transactionListItem = '[data-testid="activity-list-item"]';

/**
 * Opens the account menu from the account overview and waits for the homepage.
 *
 * @param driver - The webdriver instance.
 */
export async function openAccountMenuFromOverview(
  driver: Driver,
): Promise<void> {
  await driver.clickElement(accountMenuButton);
  await driver.delay(2000);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
}

/**
 * Switches to the activity tab and waits for the transaction list.
 *
 * @param driver - The webdriver instance.
 */
export async function openActivityTab(driver: Driver): Promise<void> {
  await driver.clickElement(activityTabButton);
  await driver.waitForSelector(transactionListItem);
  await driver.delay(1500);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
}

const nftTabSelector = '[data-testid="account-overview__nfts-tab"]';

const nftGridLocator = { css: '.nft-items__wrapper' };

const importNftLink = { text: 'Import NFT', tag: 'button' };

/**
 * Opens the NFT tab and starts the import NFT flow.
 *
 * @param driver - The webdriver instance.
 */
export async function openNftTabAndImport(driver: Driver): Promise<void> {
  await driver.clickElement(nftTabSelector);
  await driver.waitForSelector(nftGridLocator);
  await driver.delay(2500);
  await driver.clickElement(importNftLink);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
}
