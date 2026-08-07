import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsTab } from '../pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../pages/perps/perps-market-list-page';

/**
 * After a simulated position change in E2E, pushes a `userFills` snapshot via
 * `pushUserFills`, navigates back to Perps home, then opens Perps Activity and
 * asserts a trade row appears with the expected title fragment (same navigation
 * pattern as other lifecycle tests).
 *
 * `pushUserFills` is invoked more than once on purpose; see the comments below.
 * It must therefore be safe to repeat, which holds because the snapshot it
 * sends carries `isSnapshot: true` and so replaces any previous one.
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
  // Push while the market detail page is still mounted. This is the last point
  // where a Perps view is definitely active, and PerpsStreamBridge drops every
  // emit while `perpsViewActive` is false. Pushing here also warms the
  // controller's fills cache, which is what `perpsGetOrderFills` reads.
  pushUserFills();

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

  // Re-push until Perps home actually lists the fill, because the two ways it
  // can learn about one are both raceable here. The live path is closed
  // whenever no Perps view is mounted, and the frame is sent once — the mock
  // never folds it into the `userFills` POST response the way the real server
  // would. The fetch path is coalesced for 10s, so a mount that lands inside
  // that window replays the empty response an earlier mount cached and never
  // refetches. Re-emitting with Perps home mounted feeds PerpsStreamManager
  // directly, which is merged ahead of the coalesced response.
  await driver.waitUntil(
    async () => {
      pushUserFills();
      return await perpsTab.isRecentActivityPopulated();
    },
    { timeout: 10000, interval: 200 },
  );

  await perpsTab.clickRecentActivitySeeAll();

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await activityPage.waitForAnyTransactionCard();
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
