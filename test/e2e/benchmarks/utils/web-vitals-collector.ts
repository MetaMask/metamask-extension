/**
 * Web Vitals collection for E2E benchmarks.
 *
 * Two-phase approach:
 * 1. Fast path — read from `stateHooks.getWebVitalsMetrics()` (populated by
 *    the web-vitals library's PerformanceObserver callbacks).
 * 2. Fallback — create short-lived PerformanceObservers with `buffered: true`
 *    via `executeAsyncScript`, wait for async entry delivery, and compute
 *    INP/LCP/CLS directly from raw entries.
 *
 * Phase 2 exists because the web-vitals library callbacks fire asynchronously
 * and may not have updated stateHooks by the time collection runs. Direct
 * observer queries bypass this timing issue entirely.
 */

import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';

/**
 * Inline script executed via `driver.executeAsyncScript`.
 *
 * Creates PerformanceObservers for `event` (INP), `largest-contentful-paint`
 * (LCP), and `layout-shift` (CLS) with `buffered: true`. After a 200 ms
 * settling window, reads stateHooks (in case callbacks fired during the wait)
 * and fills any remaining gaps from the raw observer entries.
 *
 * Uses plain ES5-style JS because Selenium serialises the string and evaluates
 * it in the browser context where TypeScript is not available.
 */
const OBSERVE_AND_COLLECT_SCRIPT = `
var done = arguments[arguments.length - 1];
var result = {
  inp: null, lcp: null, cls: null,
  inpRating: null, lcpRating: null, clsRating: null
};

function rate(v, good, poor) {
  return v <= good ? 'good' : v <= poor ? 'needs-improvement' : 'poor';
}

var entries = { event: [], lcp: [], cls: [] };
var observers = [];
var clsSupported = false;

try {
  var o1 = new PerformanceObserver(function(list) {
    var e = list.getEntries();
    for (var i = 0; i < e.length; i++) entries.event.push(e[i]);
  });
  o1.observe({ type: 'event', buffered: true, durationThreshold: 0 });
  observers.push(o1);
} catch(e) {}

try {
  var o2 = new PerformanceObserver(function(list) {
    var e = list.getEntries();
    for (var i = 0; i < e.length; i++) entries.lcp.push(e[i]);
  });
  o2.observe({ type: 'largest-contentful-paint', buffered: true });
  observers.push(o2);
} catch(e) {}

try {
  var o3 = new PerformanceObserver(function(list) {
    var e = list.getEntries();
    for (var i = 0; i < e.length; i++) entries.cls.push(e[i]);
  });
  o3.observe({ type: 'layout-shift', buffered: true });
  clsSupported = true;
  observers.push(o3);
} catch(e) {}

setTimeout(function() {
  // Try stateHooks first (web-vitals library values, with attribution)
  var sh = window.stateHooks;
  if (sh && sh.getWebVitalsMetrics) {
    var m = sh.getWebVitalsMetrics();
    if (m.inp !== null) { result.inp = m.inp; result.inpRating = m.inpRating; }
    if (m.lcp !== null) { result.lcp = m.lcp; result.lcpRating = m.lcpRating; }
    if (m.cls !== null) { result.cls = m.cls; result.clsRating = m.clsRating; }
    sh.resetWebVitalsMetrics && sh.resetWebVitalsMetrics();
  }

  // Fill gaps from raw observer entries
  if (result.inp === null && entries.event.length > 0) {
    var maxDur = 0;
    for (var i = 0; i < entries.event.length; i++) {
      if (entries.event[i].duration > maxDur) maxDur = entries.event[i].duration;
    }
    if (maxDur > 0) {
      result.inp = maxDur;
      result.inpRating = rate(maxDur, 200, 500);
    }
  }

  if (result.lcp === null && entries.lcp.length > 0) {
    var last = entries.lcp[entries.lcp.length - 1];
    if (last.startTime > 0) {
      result.lcp = last.startTime;
      result.lcpRating = rate(last.startTime, 2500, 4000);
    }
  }

  if (result.cls === null && clsSupported) {
    var clsVal = 0;
    for (var j = 0; j < entries.cls.length; j++) {
      if (!entries.cls[j].hadRecentInput) clsVal += entries.cls[j].value;
    }
    result.cls = clsVal;
    result.clsRating = rate(clsVal, 0.1, 0.25);
  }

  for (var k = 0; k < observers.length; k++) observers[k].disconnect();
  done(result);
}, 200);
`;

/**
 * Collect Core Web Vitals from the running extension.
 *
 * @param driver - Selenium WebDriver instance with access to the extension page
 * @returns Per-run web vitals snapshot. Null values indicate the metric was not
 * observed (e.g. INP before any interaction, or LCP on unsupported pages).
 */
export async function collectWebVitals(
  driver: Driver,
): Promise<WebVitalsMetrics> {
  // Fast path: if web-vitals library callbacks have already fired, read directly
  const hookResult = await driver.executeScript(() => {
    const sh = (window as Window & { stateHooks?: Record<string, unknown> })
      .stateHooks as
      | {
          getWebVitalsMetrics?: () => WebVitalsMetrics;
          resetWebVitalsMetrics?: () => void;
        }
      | undefined;

    if (sh?.getWebVitalsMetrics) {
      const m = sh.getWebVitalsMetrics();
      if (m.inp !== null || m.lcp !== null || m.cls !== null) {
        sh.resetWebVitalsMetrics?.();
        return m;
      }
    }
    return null;
  });

  if (hookResult) {
    return hookResult;
  }

  // Slow path: direct PerformanceObserver queries with 200 ms settling window
  return (await driver.executeAsyncScript(
    OBSERVE_AND_COLLECT_SCRIPT,
  )) as WebVitalsMetrics;
}
