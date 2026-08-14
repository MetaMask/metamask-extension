import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsTab } from '../pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../pages/perps/perps-market-list-page';

/**
 * After a simulated position change in E2E, navigates back to Perps home,
 * pushes a `userFills` snapshot via `pushUserFills`, then opens Perps Activity
 * and asserts a trade row appears with the expected title fragment.
 *
 * `pushUserFills` runs after Perps home is loaded: the default WS mock answers
 * `userFills` subscribe with an empty snapshot, so pushing earlier (on market
 * detail) is often wiped when home remounts and re-subscribes.
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
  const marketDetailPage = new PerpsMarketDetailPage(driver);
  await marketDetailPage.clickBack();
  try {
    const marketListPage = new PerpsMarketListPage(driver);
    await marketListPage.clickBack();
  } catch (error) {
    console.error('Market list not displayed, moving on', error);
  }

  const perpsTab = new PerpsTab(driver);
  await perpsTab.navigateToPerpsHome();
  await perpsTab.checkPageIsLoaded();

  // After home mount/subscribe (empty default snapshot), push the close fill.
  pushUserFills();

  // See All only renders once fills have populated the section (not on
  // loading skeleton or empty state).
  await perpsTab.waitForRecentActivitySection();
  await perpsTab.clickRecentActivitySeeAll();

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await activityPage.waitForAnyTransactionCard();
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
