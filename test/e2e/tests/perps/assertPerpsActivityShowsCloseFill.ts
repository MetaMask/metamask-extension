import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../../page-objects/pages/perps/perps-activity-page';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';

/**
 * After a simulated position change in E2E, pushes a `userFills` snapshot via
 * `pushUserFills`, then opens Perps Activity and asserts a trade row appears
 * with the expected title fragment (same navigation pattern as other lifecycle tests).
 * @param options
 * @param options.driver
 * @param options.perpsHomePage
 * @param options.marketDetailPage
 * @param options.pushUserFills
 * @param options.expectedTitleContains
 * @param options.settleDelayMs
 */
export async function assertPerpsActivityShowsCloseFill(options: {
  driver: Driver;
  perpsHomePage: PerpsHomePage;
  marketDetailPage: PerpsMarketDetailPage;
  pushUserFills: () => void;
  /** Substring of the trade title, e.g. `Closed long` or `Closed short`. */
  expectedTitleContains: string;
  settleDelayMs?: number;
}): Promise<void> {
  const {
    driver,
    perpsHomePage,
    marketDetailPage,
    pushUserFills,
    expectedTitleContains,
    settleDelayMs = 1500,
  } = options;

  pushUserFills();
  await driver.delay(settleDelayMs);

  await marketDetailPage.clickBack();
  await perpsHomePage.navigateToPerpsHome();
  await perpsHomePage.checkPageIsLoaded();
  await perpsHomePage.clickRecentActivitySeeAll();

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await activityPage.waitForAnyTransactionCard();
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
