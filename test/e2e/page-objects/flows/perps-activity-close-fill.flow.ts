import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';
import { PerpsTab } from '../pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../pages/perps/perps-market-list-page';

// TEMP perps fills diagnostic — do not merge.
// Logs the background bridge fills session (`perpsGetFillsDebug`) and the UI
// stream manager fills cache so CI output shows where a pushed fill was lost.
async function logFillsDiagnostic(driver: Driver, label: string) {
  try {
    const result = await driver.executeScript(`
      const hooks = window.stateHooks || {};
      let ui;
      try {
        const data = hooks.getPerpsStreamManager?.()?.fills?.getCachedData?.();
        ui = Array.isArray(data)
          ? {
              uiFillsLength: data.length,
              uiFills: data.slice(0, 5).map((f) => ({
                symbol: f.symbol,
                orderId: f.orderId,
                timestamp: f.timestamp,
              })),
            }
          : { uiFillsLength: null, hasHook: Boolean(hooks.getPerpsStreamManager) };
      } catch (error) {
        ui = { uiError: String(error) };
      }
      const bg = hooks.submitRequestToBackground
        ? hooks
            .submitRequestToBackground('perpsGetFillsDebug', [])
            .catch((error) => ({ bgError: String(error) }))
        : Promise.resolve({ bgError: 'submitRequestToBackground hook missing' });
      return bg.then((b) => JSON.stringify({ ui, bg: b }));
    `);
    console.log(`[PERPS-FILLS-DIAG] ${label}: ${result}`);
  } catch (error) {
    console.log(
      `[PERPS-FILLS-DIAG] ${label}: diagnostic failed: ${String(error)}`,
    );
  }
}

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
  await logFillsDiagnostic(driver, 'before first push');
  pushUserFills();

  const marketDetailPage = new PerpsMarketDetailPage(driver);
  await marketDetailPage.checkPageIsLoaded();
  await logFillsDiagnostic(driver, 'after first push (market detail)');
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
  } catch (error) {
    await logFillsDiagnostic(driver, 'FAILED: activity has no row');

    // Refresh experiment: a new UI connection replays the bridge fills cache.
    // Row appears => fill was cached but not emitted; still missing => the
    // bridge fills subscription never received it.
    await driver.refresh();
    let onActivity = true;
    try {
      await activityPage.checkPageIsLoaded();
    } catch {
      onActivity = false;
    }
    if (!onActivity) {
      await perpsTab.navigateToPerpsHome();
      await perpsTab.waitForPerpsViewStable();
      await perpsTab.waitForRecentActivitySection();
      await perpsTab.clickRecentActivitySeeAll();
      await activityPage.checkPageIsLoaded();
    }
    let rowAfterRefresh = true;
    try {
      await activityPage.waitForAnyTransactionCard();
    } catch {
      rowAfterRefresh = false;
    }
    await logFillsDiagnostic(driver, 'after refresh');
    console.log(
      `[PERPS-FILLS-DIAG] REFRESH RESULT: ${
        rowAfterRefresh ? 'row appeared after refresh' : 'row still missing'
      }`,
    );
    throw error;
  }
  await logFillsDiagnostic(driver, 'PASSED: activity has a row');
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
