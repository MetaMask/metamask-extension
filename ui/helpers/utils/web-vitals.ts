/**
 * Core Web Vitals instrumentation using the web-vitals library.
 *
 * Provides utilities to measure INP, LCP, and CLS using the attribution build
 * which shows which element/script caused each metric.
 *
 * @see https://github.com/GoogleChrome/web-vitals
 * @see https://web.dev/articles/inp
 * @see https://web.dev/articles/lcp
 * @see https://web.dev/articles/cls
 */

// Use UMD build for Browserify/LavaMoat compatibility (ESM not supported)
// Types are declared in types/web-vitals-umd.d.ts
import type {
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
  CLSMetricWithAttribution,
} from 'web-vitals/dist/web-vitals.attribution.umd.cjs';
import {
  onINP,
  onLCP,
  onCLS,
} from 'web-vitals/dist/web-vitals.attribution.umd.cjs';

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
 * Report a metric to Sentry.
 * Uses globalThis.sentry to avoid direct Sentry dependency.
 */
function reportMetricToSentry(
  name: string,
  value: number,
  unit: 'millisecond' | 'none',
  rating: string,
  attribution?: Record<string, unknown>,
): void {
  const sentry = globalThis.sentry;
  if (!sentry) {
    return;
  }

  // Set measurement for Sentry traces
  sentry.setMeasurement?.(`benchmark.${name.toLowerCase()}`, value, unit);

  // Set rating tag for filtering
  sentry.setTag?.(`${name.toLowerCase()}.rating`, rating);

  // Set attribution context if available
  if (attribution && Object.keys(attribution).length > 0) {
    sentry.setContext?.(`${name.toLowerCase()}_attribution`, attribution);
  }

  // Add breadcrumb for poor metrics
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

      reportMetricToSentry(
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

      reportMetricToSentry(
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
      reportMetricToSentry('CLS', value, 'none', rating, attributionData);
    });
  } catch (error) {
    console.warn('[Performance] Failed to initialize CLS observer:', error);
  }
}

/**
 * Initialize all Web Vitals observers.
 *
 * Sets up INP, LCP, and CLS measurement with attribution.
 * Metrics are automatically reported to Sentry when available.
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
