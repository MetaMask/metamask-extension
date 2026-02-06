/**
 * Core Web Vitals instrumentation using the web-vitals library.
 *
 * Provides utilities to measure INP, LCP, and CLS using the attribution build
 * which shows which element/script caused each metric.
 *
 * IMPORTANT: On `chrome-extension://` pages, Chrome does not emit
 * `PerformancePaintTiming` (`first-paint`, `first-contentful-paint`) or
 * `largest-contentful-paint` entries. `PerformanceNavigationTiming.responseStart`
 * is also 0 for local extension files. As a result,
 * `browserTracingIntegration` in `setupSentry.js` cannot capture LCP, FCP,
 * CLS, or TTFB on production extension pages (confirmed: 19.5M pageload
 * transactions with zero web vitals measurements in Sentry). The
 * `onLCP`/`onCLS` callbacks below may not fire in production either, as
 * they depend on the same `PerformanceObserver` entry types. `onINP` uses
 * `PerformanceEventTiming` which IS supported on extension pages, so INP
 * may still report in production.
 *
 * These observers reliably fire during CI E2E benchmark runs, where metrics
 * are collected via `stateHooks.getWebVitalsMetrics()` and sent to Sentry
 * by `test/e2e/benchmarks/send-to-sentry.ts`.
 *
 * @see https://github.com/GoogleChrome/web-vitals
 * @see https://web.dev/articles/inp
 * @see https://web.dev/articles/lcp
 * @see https://web.dev/articles/cls
 */

import type {
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
  CLSMetricWithAttribution,
  // @ts-expect-error suppress CommonJS vs ECMAScript error
} from 'web-vitals/attribution';
// @ts-expect-error suppress CommonJS vs ECMAScript error
import { onINP, onLCP, onCLS } from 'web-vitals/attribution';

/**
 * Web Vitals metrics stored for E2E benchmark retrieval.
 * Values are updated as metrics are reported by the web-vitals library.
 */
export type WebVitalsMetrics = {
  /** Interaction to Next Paint in milliseconds */
  inp: number | null;
  /** Largest Contentful Paint in milliseconds */
  lcp: number | null;
  /** Cumulative Layout Shift (unitless) */
  cls: number | null;
  /** Rating for INP metric */
  inpRating: 'good' | 'needs-improvement' | 'poor' | null;
  /** Rating for LCP metric */
  lcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  /** Rating for CLS metric */
  clsRating: 'good' | 'needs-improvement' | 'poor' | null;
};

/**
 * Stored web vitals metrics for E2E benchmark retrieval.
 * Exposed via stateHooks.getWebVitalsMetrics() in test mode.
 */
const webVitalsMetrics: WebVitalsMetrics = {
  inp: null,
  lcp: null,
  cls: null,
  inpRating: null,
  lcpRating: null,
  clsRating: null,
};

/** INP threshold for "good" rating in milliseconds */
const INP_GOOD_THRESHOLD_MS = 200;

/** INP threshold for "needs improvement" rating in milliseconds */
const INP_NEEDS_IMPROVEMENT_THRESHOLD_MS = 500;

/** LCP threshold for "good" rating in milliseconds */
const LCP_GOOD_THRESHOLD_MS = 2500;

/** LCP threshold for "needs improvement" rating in milliseconds */
const LCP_NEEDS_IMPROVEMENT_THRESHOLD_MS = 4000;

/** CLS threshold for "good" rating (unitless) */
const CLS_GOOD_THRESHOLD = 0.1;

/** CLS threshold for "needs improvement" rating (unitless) */
const CLS_NEEDS_IMPROVEMENT_THRESHOLD = 0.25;

/**
 * Get rating based on thresholds.
 *
 * @param value
 * @param goodThreshold
 * @param needsImprovementThreshold
 */
function getRating(
  value: number,
  goodThreshold: number,
  needsImprovementThreshold: number,
): 'good' | 'needs-improvement' | 'poor' {
  if (value < goodThreshold) {
    return 'good';
  }
  if (value < needsImprovementThreshold) {
    return 'needs-improvement';
  }
  return 'poor';
}

/**
 * Enrich Sentry scope with web vitals context.
 *
 * Numeric measurements are NOT sent here. On `chrome-extension://` pages,
 * `browserTracingIntegration` cannot capture web vitals because Chrome does
 * not emit paint performance entries for the `chrome-extension://` protocol.
 * Benchmark measurements are handled separately by `send-to-sentry.ts`.
 *
 * This function adds contextual data when callbacks do fire:
 * - Rating tags for filtering (e.g. `inp.rating:poor`)
 * - Attribution context (which element/interaction caused the metric)
 * - Breadcrumbs on poor/needs-improvement metrics for error correlation
 *
 * @param name - Metric name (INP, LCP, CLS)
 * @param value - Metric value for breadcrumb message formatting
 * @param unit - Display unit for breadcrumb message ('millisecond' | 'none')
 * @param rating - Rating classification
 * @param attribution - Attribution data from web-vitals library
 */
function enrichSentryWithWebVitals(
  name: string,
  value: number,
  unit: 'millisecond' | 'none',
  rating: string,
  attribution?: Record<string, unknown>,
): void {
  const { sentry } = globalThis;
  if (!sentry) {
    return;
  }

  // Set rating tag for filtering (e.g. inp.rating:poor in Sentry Discover)
  sentry.setTag?.(`${name.toLowerCase()}.rating`, rating);

  // Set attribution context if available
  if (attribution && Object.keys(attribution).length > 0) {
    sentry.setContext?.(`${name.toLowerCase()}_attribution`, attribution);
  }

  // Add breadcrumb for poor metrics — enriches the next error event
  if (rating === 'poor' || rating === 'needs-improvement') {
    sentry.addBreadcrumb?.({
      category: `performance.${name.toLowerCase()}`,
      message: `${name}: ${value}${unit === 'millisecond' ? 'ms' : ''} (${rating})`,
      level: rating === 'poor' ? 'warning' : 'info',
      data: attribution,
    });
  }
}

/**
 * Initialize INP (Interaction to Next Paint) observer.
 *
 * INP measures how long it takes for the page to respond to user interactions.
 * It's a Core Web Vital that replaced FID in 2024.
 *
 * Unlike LCP/CLS, INP uses `PerformanceEventTiming` entries which ARE
 * supported on `chrome-extension://` pages, so this observer may fire in
 * production when users interact with the extension popup.
 *
 * @see https://web.dev/articles/inp
 */
export function initINPObserver(): void {
  try {
    onINP((metric: INPMetricWithAttribution) => {
      const { value, attribution } = metric;
      const rating = getRating(
        value,
        INP_GOOD_THRESHOLD_MS,
        INP_NEEDS_IMPROVEMENT_THRESHOLD_MS,
      );

      // Store for E2E benchmark retrieval
      webVitalsMetrics.inp = value;
      webVitalsMetrics.inpRating = rating;

      const attributionData: Record<string, unknown> = {};
      if (attribution) {
        attributionData.interactionTarget =
          attribution.interactionTarget ?? null;
        attributionData.interactionType = attribution.interactionType ?? null;
        attributionData.loadState = attribution.loadState ?? null;
        attributionData.inputDelay = attribution.inputDelay ?? null;
        attributionData.processingDuration =
          attribution.processingDuration ?? null;
        attributionData.presentationDelay =
          attribution.presentationDelay ?? null;
      }

      enrichSentryWithWebVitals(
        'INP',
        value,
        'millisecond',
        rating,
        attributionData,
      );
    });
  } catch (error) {
    console.warn('[Performance] Failed to initialize INP observer:', error);
  }
}

/**
 * Initialize LCP (Largest Contentful Paint) observer.
 *
 * LCP measures when the largest content element finishes rendering.
 * For extensions, this is typically the account list or balance display.
 *
 * NOTE: Chrome does not emit `largest-contentful-paint` entries on
 * `chrome-extension://` pages. This observer will not fire in production
 * but does fire during CI E2E benchmark runs.
 *
 * @see https://web.dev/articles/lcp
 */
export function initLCPObserver(): void {
  try {
    onLCP((metric: LCPMetricWithAttribution) => {
      const { value, attribution } = metric;
      const rating = getRating(
        value,
        LCP_GOOD_THRESHOLD_MS,
        LCP_NEEDS_IMPROVEMENT_THRESHOLD_MS,
      );

      // Store for E2E benchmark retrieval
      webVitalsMetrics.lcp = value;
      webVitalsMetrics.lcpRating = rating;

      const attributionData: Record<string, unknown> = {};
      if (attribution) {
        attributionData.element = attribution.element ?? null;
        attributionData.url = attribution.url ?? null;
      }

      enrichSentryWithWebVitals(
        'LCP',
        value,
        'millisecond',
        rating,
        attributionData,
      );
    });
  } catch (error) {
    console.warn('[Performance] Failed to initialize LCP observer:', error);
  }
}

/**
 * Initialize CLS (Cumulative Layout Shift) observer.
 *
 * CLS measures unexpected movement of visible elements.
 * Values >0.1 indicate visual instability.
 *
 * NOTE: CLS depends on `layout-shift` entries. On `chrome-extension://`
 * pages, CLS observation is unreliable — even if `layout-shift` entries
 * are emitted, `browserTracingIntegration` deletes CLS when FCP is missing.
 * This observer primarily fires during CI E2E benchmark runs.
 *
 * @see https://web.dev/articles/cls
 */
export function initCLSObserver(): void {
  try {
    onCLS((metric: CLSMetricWithAttribution) => {
      const { value, attribution } = metric;
      const rating = getRating(
        value,
        CLS_GOOD_THRESHOLD,
        CLS_NEEDS_IMPROVEMENT_THRESHOLD,
      );

      // Store for E2E benchmark retrieval
      webVitalsMetrics.cls = value;
      webVitalsMetrics.clsRating = rating;

      const attributionData: Record<string, unknown> = {};
      if (attribution) {
        attributionData.largestShiftTarget =
          attribution.largestShiftTarget ?? null;
        attributionData.largestShiftTime = attribution.largestShiftTime ?? null;
        attributionData.largestShiftValue =
          attribution.largestShiftValue ?? null;
      }

      // CLS is unitless
      enrichSentryWithWebVitals('CLS', value, 'none', rating, attributionData);
    });
  } catch (error) {
    console.warn('[Performance] Failed to initialize CLS observer:', error);
  }
}

/**
 * Initialize all Web Vitals observers.
 *
 * Sets up INP, LCP, and CLS measurement with attribution.
 * On `chrome-extension://` pages, only INP is expected to fire in
 * production. LCP and CLS fire during CI E2E benchmark runs where
 * data is collected via `stateHooks.getWebVitalsMetrics()`.
 */
export function initWebVitals(): void {
  initINPObserver();
  initLCPObserver();
  initCLSObserver();
}

/**
 * Get the current web vitals metrics.
 * Returns a copy of the stored metrics to prevent mutation.
 *
 * @returns Current web vitals metrics
 */
export function getWebVitalsMetrics(): WebVitalsMetrics {
  return { ...webVitalsMetrics };
}

/**
 * Reset web vitals metrics to initial state.
 * Useful for clearing metrics between benchmark runs.
 */
export function resetWebVitalsMetrics(): void {
  webVitalsMetrics.inp = null;
  webVitalsMetrics.lcp = null;
  webVitalsMetrics.cls = null;
  webVitalsMetrics.inpRating = null;
  webVitalsMetrics.lcpRating = null;
  webVitalsMetrics.clsRating = null;
}

// Expose for E2E testing
const { env } = process;
if ((env.IN_TEST || env.METAMASK_DEBUG) && globalThis.stateHooks) {
  globalThis.stateHooks.initWebVitals = initWebVitals;
  globalThis.stateHooks.getWebVitalsMetrics = getWebVitalsMetrics;
  globalThis.stateHooks.resetWebVitalsMetrics = resetWebVitalsMetrics;
}
