import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';

/**
 * Leaves the current route and returns to the Tron homepage.
 *
 * @param driver - The webdriver instance.
 * @param expectedBalance - Optional homepage header balance to wait for.
 */
export async function returnToTronHome(
  driver: Driver,
  expectedBalance?: string,
): Promise<void> {
  const homePage = new HomePage(driver);
  await homePage.navigateToHome();
  if (expectedBalance !== undefined) {
    await homePage.checkExpectedBalanceIsDisplayed(expectedBalance);
  }
}
