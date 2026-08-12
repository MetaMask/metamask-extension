import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';

const accountMenuButton = '[data-testid="account-menu-icon"]';

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
