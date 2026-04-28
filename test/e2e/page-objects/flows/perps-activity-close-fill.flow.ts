import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsHomePage } from '../pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../pages/perps/perps-market-list-page';

/**
 * After a simulated position change in E2E, pushes a `userFills` snapshot via
 * `pushUserFills`, then opens Perps Activity and asserts a trade row appears
 * with the expected title fragment (same navigation pattern as other lifecycle tests).
 *
 * @param options
 * @param options.driver
 * @param options.pushUserFills
 * @param options.expectedTitleContains
 */
export async function assertPerpsActivityShowsCloseFill({
  driver,
  pushUserFills,
  expectedTitleContains,
}: {
  driver: Driver;
  pushUserFills: () => void;
  /** Substring of the trade title, e.g. `Closed long` or `Closed short`. */
  expectedTitleContains: string;
}): Promise<void> {
  pushUserFills();

  const marketDetailPage = new PerpsMarketDetailPage(driver);
  await marketDetailPage.clickBack();

  // Detail `navigate(-1)` can land on the market list (Explore → list → asset). That screen
  // has no `account-overview__perps-tab`; use the list header back to reach Perps home first.
  try {
    await driver.waitForSelector({ testId: 'market-list-view' });
    await new PerpsMarketListPage(driver).clickBack();
  } catch {
    // Already past the list (e.g. opened the asset from the home position card).
  }

  const perpsHomePage = new PerpsHomePage(driver);
  await perpsHomePage.navigateToPerpsHome();
  await perpsHomePage.checkPageIsLoaded();
  await perpsHomePage.clickRecentActivitySeeAll();

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await activityPage.waitForAnyTransactionCard();
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
