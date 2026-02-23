/**
 * Web Vitals collection for E2E benchmarks.
 *
 * Reads Core Web Vitals (INP, LCP, CLS) from the extension's stateHooks,
 * which are populated by the web-vitals instrumentation in ui/index.js.
 *
 * Must be called after user interactions for INP to report meaningful data.
 */

import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';

/**
 * Collect Core Web Vitals from the running extension via stateHooks,
 * then reset metrics so the next iteration starts with a clean slate.
 *
 * Without the reset, metrics persist across benchmark iterations — if an
 * observer doesn't fire in a later run (e.g. LCP only fires on initial
 * load), the stale value from an earlier iteration would be recorded.
 *
 * @param driver - Selenium WebDriver instance with access to the extension page
 * @returns Per-run web vitals snapshot. Null values indicate the metric was not
 * observed (e.g. INP before any interaction, or LCP on a non-initial load).
 */
export async function collectWebVitals(
  driver: Driver,
): Promise<WebVitalsMetrics> {
  return await driver.executeScript(() => {
    const { stateHooks } = window as Window & {
      stateHooks?: {
        getWebVitalsMetrics?: () => WebVitalsMetrics;
        resetWebVitalsMetrics?: () => void;
      };
    };

    if (stateHooks?.getWebVitalsMetrics) {
      const metrics = stateHooks.getWebVitalsMetrics();
      stateHooks.resetWebVitalsMetrics?.();
      return metrics;
    }

    return {
      inp: null,
      lcp: null,
      cls: null,
      inpRating: null,
      lcpRating: null,
      clsRating: null,
    };
  });
}
