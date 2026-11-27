import type { Driver } from '../../webdriver/driver';
import type TokensTab from '../../page-objects/pages/home/tokens-tab';
import { measureStepWithLongTasks } from './long-task-helper';
import { measureStepInPage } from './in-page-step-timer';
import type { LongTaskStepResult, TimerResult } from './types';

/**
 * The chart header's percent change, rendered only once real historical prices
 * load (`asset-chart.tsx`, `token-price-header.tsx`). It never appears unless
 * the historical-prices mock matches the URL the chart requests.
 */
export const PRICE_CHART_DATA =
  '[data-testid="parent-selector-asset-details"] [data-testid="asset-price-percent-change"]';

/**
 * Asset click to the price chart's data: both timers end at `PRICE_CHART_DATA`,
 * not at the page's first render. The long-task window opens at the click, and
 * `windowOpensAtTrigger` has the step read whether it did.
 */
export async function measureAssetClickToPriceChart(
  driver: Driver,
  tokensTab: TokensTab,
  assetName: string,
  steps: LongTaskStepResult[],
): Promise<TimerResult[]> {
  return await measureStepInPage(driver, 'assetClickToPriceChart', {
    endSelector: PRICE_CHART_DATA,
    // `clickOnAsset` may first expand the low-value section, so only input
    // inside a token row starts the in-page timer.
    startWithin: '[data-testid="multichain-token-list-button"]',
    resetLongTasksAtStart: true,
    trigger: () => tokensTab.clickOnAsset(assetName),
    settle: async () => {
      steps.push(
        await measureStepWithLongTasks(
          driver,
          'assetClickToPriceChart',
          async () => {
            await tokensTab.checkPriceChartIsShown();
            await driver.waitForSelector(PRICE_CHART_DATA);
          },
          { legacyTimerId: true, windowOpensAtTrigger: true },
        ),
      );
    },
  });
}
