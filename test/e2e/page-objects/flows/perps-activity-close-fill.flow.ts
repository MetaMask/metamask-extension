import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsTab } from '../pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../pages/perps/perps-market-list-page';

/**
 * After a simulated position change in E2E, navigates back to Perps home, pushes
 * a `userFills` snapshot via `pushUserFills`, then opens Perps Activity and
 * asserts a trade row appears with the expected title fragment (same navigation
 * pattern as other lifecycle tests).
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

  // Push only once a Perps view is mounted and settled. PerpsStreamBridge drops
  // every emit while `perpsViewActive` is false, and the boundary that owns that
  // flag is torn down and re-created while navigating off the market detail page.
  // A frame that lands in that window is discarded for good: the snapshot is
  // sent once and the REST mocks never replay it, so Recent Activity would stay
  // empty for the rest of the test.
  pushUserFills();
  await perpsTab.waitForRecentActivitySection();
  await perpsTab.clickRecentActivitySeeAll();

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await activityPage.waitForAnyTransactionCard();
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
