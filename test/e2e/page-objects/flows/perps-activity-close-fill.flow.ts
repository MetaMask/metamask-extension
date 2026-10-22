import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsTab } from '../pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../pages/perps/perps-market-list-page';
import { lockAndWaitForLoginPage, login } from './login.flow';

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
  await marketDetailPage.checkPageIsLoaded();
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

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  try {
    await activityPage.waitForAnyTransactionCard();
  } catch {
    // The wallet's live `userFills` listener can stop receiving pushes. Lock
    // and unlock rebuild the perps session, and the new `userFills` subscribe
    // snapshot replays the fill.
    // Remove once https://github.com/MetaMask/metamask-extension/issues/47287 is fixed.
    await driver.navigate();
    await lockAndWaitForLoginPage(driver);
    await login(driver, {
      validateBalance: false,
      waitForNonEvmAccounts: false,
    });
    await perpsTab.navigateToPerpsHome();
    await perpsTab.waitForPerpsViewStable();
    await perpsTab.waitForRecentActivitySection();
    await perpsTab.clickRecentActivitySeeAll();
    await activityPage.checkPageIsLoaded();
    await activityPage.waitForAnyTransactionCard();
  }
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
