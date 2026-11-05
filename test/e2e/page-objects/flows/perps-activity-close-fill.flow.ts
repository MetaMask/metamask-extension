import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsTab } from '../pages/home/perps-tab';
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
 * @param options.openActivityFromMarketDetail - Open Activity from the market
 * screen instead of going back through Perps home. Market detail and Activity
 * share one Perps layout, so the close fill is not dropped on the way.
 */
export async function assertPerpsActivityShowsCloseFill({
  driver,
  pushUserFills,
  expectedTitleContains,
  openActivityFromMarketDetail = false,
}: {
  driver: Driver;
  pushUserFills: () => void;
  /** Substring of the trade title, e.g. `Closed long` or `Closed short`. */
  expectedTitleContains: string;
  openActivityFromMarketDetail?: boolean;
}): Promise<void> {
  pushUserFills();

  const marketDetailPage = new PerpsMarketDetailPage(driver);
  await marketDetailPage.checkPageIsLoaded();
  if (openActivityFromMarketDetail) {
    await marketDetailPage.clickViewAllActivity();
    await assertActivityShowsTrade(driver, expectedTitleContains);
    return;
  }
  await marketDetailPage.clickBack();

  const marketListPage = new PerpsMarketListPage(driver);
  const onMarketList = await marketListPage.isPageLoaded();
  if (onMarketList) {
    await marketListPage.clickBack();
  }

  const perpsTab = new PerpsTab(driver);
  await perpsTab.navigateToPerpsHome();
  await perpsTab.waitForPerpsViewStable();
  // Activity only shows a just-closed trade via the live fill (REST history is
  // cached for 60s), and the wallet can drop a fill that arrives while leaving
  // market detail. Push it again so the trade reliably reaches Activity.
  pushUserFills();
  await perpsTab.waitForRecentActivitySection();
  await perpsTab.clickRecentActivitySeeAll();

  await assertActivityShowsTrade(driver, expectedTitleContains);
}

async function assertActivityShowsTrade(
  driver: Driver,
  expectedTitleContains: string,
): Promise<void> {
  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await activityPage.waitForAnyTransactionCard();
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
