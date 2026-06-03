import type { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsHomePage } from '../pages/perps/perps-home-page';

/**
 * Opens the Perps Activity page from account overview.
 *
 * @param driver - The webdriver instance.
 */
export async function openPerpsActivityPage({
  driver,
}: {
  driver: Driver;
}): Promise<PerpsActivityPage> {
  const homePage = new HomePage(driver);
  const perpsHomePage = new PerpsHomePage(driver);
  await homePage.goToPerpsTab();
  await perpsHomePage.checkPageIsLoaded();
  await perpsHomePage.waitForBalanceSection();
  await perpsHomePage.clickRecentActivitySeeAll();

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();

  return activityPage;
}
