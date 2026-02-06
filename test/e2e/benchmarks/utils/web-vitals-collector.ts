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
 * Collect Core Web Vitals from the running extension via stateHooks.
 *
 * @param driver - Selenium WebDriver instance with access to the extension page
 * @returns Per-run web vitals snapshot. Null values indicate the metric was not
 *   observed (e.g. INP before any interaction, or LCP on a non-initial load).
 */
export async function collectWebVitals(
  driver: Driver,
): Promise<WebVitalsMetrics> {
  return await driver.executeScript(() => {
    const stateHooks = (
      window as Window & {
        stateHooks?: {
          getWebVitalsMetrics?: () => WebVitalsMetrics;
        };
      }
    ).stateHooks;

    if (stateHooks?.getWebVitalsMetrics) {
      return stateHooks.getWebVitalsMetrics();
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

/** Empty web vitals snapshot for initialization / fallback */
export function createEmptyWebVitalsMetrics(): WebVitalsMetrics {
  return {
    inp: null,
    lcp: null,
    cls: null,
    inpRating: null,
    lcpRating: null,
    clsRating: null,
  };
}
