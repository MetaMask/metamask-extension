import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsTab } from '../pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../pages/perps/perps-market-list-page';

/**
 * After a simulated position change in E2E, navigates back to Perps home, opens
 * Perps Activity and asserts a trade row appears with the expected title
 * fragment (same navigation pattern as other lifecycle tests). A `userFills`
 * snapshot is pushed via `pushUserFills` until the fill shows up.
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
  // Push while the market detail page is still mounted, so the fill can also
  // reach the UI live: PerpsStreamBridge drops every emit made while no Perps
  // view is active, and navigating back closes that window.
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
  await perpsTab.waitForRecentActivitySection();

  // Re-push until the fill lands. A `userFills` snapshot both replaces the
  // controller's fills cache and notifies live subscribers, but neither helps
  // if it arrives while a view is mid-mount: the cache read happens once, and
  // the live subscriber is not registered yet. The controller then answers
  // `perpsGetOrderFills` from that initialized-but-empty cache without ever
  // going to the wire, so nothing retries on its own. Pushing again once the
  // view is up is delivered straight to the mounted subscriber. Snapshots
  // replace rather than append, so repeating one is harmless.
  await driver.waitUntil(
    async () => {
      if (await perpsTab.isRecentActivitySeeAllPresent()) {
        return true;
      }
      pushUserFills();
      return false;
    },
    { interval: 500, timeout: 30000 },
  );
  await perpsTab.clickRecentActivitySeeAll();

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await driver.waitUntil(
    async () => {
      if (await activityPage.isAnyTransactionCardPresent()) {
        return true;
      }
      pushUserFills();
      return false;
    },
    { interval: 500, timeout: 30000 },
  );

  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
