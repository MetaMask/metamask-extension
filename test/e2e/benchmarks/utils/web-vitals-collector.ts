/**
 * Web Vitals collection for E2E benchmarks.
 *
 * Measurement strategy per metric:
 *
 * **INP** — Two-tier: (1) `stateHooks.getWebVitalsMetrics()` from the
 * `onINP` observer with `{ reportAllChanges: true }`, capturing INP from
 * real WebDriver interactions. (2) PerformanceObserver (`event` type,
 * `buffered: true`) + Selenium Actions probe generating a trusted pointer
 * interaction with a 16ms busy-wait handler. Falls back to CDP
 * `Input.dispatchMouseEvent` if Actions API is unavailable.
 *
 * **FCP** — Read from `performance.getEntriesByType('paint')`.
 *
 * **LCP** — (1) PerformanceObserver (`largest-contentful-paint`), then
 * (2) `performance.mark('mm-hero-painted')` set by `AccountOverviewLayout`
 * after hero content renders, then null.
 *
 * **CLS** — PerformanceObserver (`layout-shift` type).
 * Falls back to 0 on extension pages where the observer is unsupported.
 */

import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';

/**
 * Setup script: creates PerformanceObservers for event timing, LCP,
 * and CLS; reads FCP from paint entries; registers a busy-wait
 * pointerdown handler for the INP probe.
 * Stores state on `window.__cwv` for the read script.
 */
const SETUP_SCRIPT = `
var w = window;
w.__cwv = {
  event: [], lcp: [], cls: [],
  observers: [],
  clsSupported: false,
  eventObserverSupported: false,
  probeReceived: false,
  fcp: null
};

try {
  var pe = performance.getEntriesByType('paint');
  for (var i = 0; i < pe.length; i++) {
    if (pe[i].name === 'first-contentful-paint') {
      w.__cwv.fcp = pe[i].startTime;
    }
  }
} catch(e) {}

try {
  var o1 = new PerformanceObserver(function(list) {
    var e = list.getEntries();
    for (var i = 0; i < e.length; i++) w.__cwv.event.push(e[i]);
  });
  o1.observe({ type: 'event', buffered: true, durationThreshold: 0 });
  w.__cwv.eventObserverSupported = true;
  w.__cwv.observers.push(o1);
} catch(e) {}

try {
  document.addEventListener('pointerdown', function busyWait() {
    w.__cwv.probeReceived = true;
    var end = performance.now() + 16;
    while (performance.now() < end) {}
  }, { once: true });
} catch(e) {}

try {
  var o2 = new PerformanceObserver(function(list) {
    var e = list.getEntries();
    for (var i = 0; i < e.length; i++) w.__cwv.lcp.push(e[i]);
  });
  o2.observe({ type: 'largest-contentful-paint', buffered: true });
  w.__cwv.observers.push(o2);
} catch(e) {}

try {
  var o4 = new PerformanceObserver(function(list) {
    var e = list.getEntries();
    for (var i = 0; i < e.length; i++) w.__cwv.cls.push(e[i]);
  });
  o4.observe({ type: 'layout-shift', buffered: true });
  w.__cwv.clsSupported = true;
  w.__cwv.observers.push(o4);
} catch(e) {}
`;

/**
 * Read script: computes metrics from observer entries, paint timing,
 * and stateHooks (web-vitals library).
 *
 * INP priority: stateHooks (captures real interactions since page load)
 * → direct PerformanceObserver entries (probe + buffered) → null.
 * FCP from paint entries.
 * LCP from stateHooks → PerformanceObserver → mm-hero-painted mark.
 * CLS from stateHooks first, then observer entries as fallback.
 */
const READ_SCRIPT = `
var cwv = window.__cwv || {
  event: [], lcp: [], cls: [], observers: [],
  clsSupported: false, eventObserverSupported: false, probeReceived: false, fcp: null
};
var result = {
  inp: null, fcp: null, lcp: null, cls: null,
  inpRating: null, fcpRating: null, lcpRating: null, clsRating: null
};

function rate(v, good, poor) {
  return v <= good ? 'good' : v <= poor ? 'needs-improvement' : 'poor';
}

// FCP: always read from paint entries (available on extension pages)
if (cwv.fcp !== null) {
  result.fcp = cwv.fcp;
  result.fcpRating = rate(cwv.fcp, 1800, 3000);
}

// Check stateHooks for INP/LCP/CLS from web-vitals library.
// The onINP observer has been running since page startup with
// { reportAllChanges: true }, so it captures real benchmark interactions.
var sh = window.stateHooks;
var stateHooksInp = null;
if (sh && sh.getWebVitalsMetrics) {
  var m = sh.getWebVitalsMetrics();
  if (m.inp !== null) {
    stateHooksInp = m.inp;
    result.inp = m.inp;
    result.inpRating = m.inpRating;
  }
  if (m.lcp !== null) { result.lcp = m.lcp; result.lcpRating = m.lcpRating; }
  if (m.cls !== null) { result.cls = m.cls; result.clsRating = m.clsRating; }
  sh.resetWebVitalsMetrics && sh.resetWebVitalsMetrics();
}

// INP fallback: direct PerformanceObserver event entries (probe + buffered)
if (result.inp === null && cwv.event.length > 0) {
  var maxDur = 0;
  for (var i = 0; i < cwv.event.length; i++) {
    if (cwv.event[i].duration > maxDur) maxDur = cwv.event[i].duration;
  }
  result.inp = maxDur;
  result.inpRating = rate(maxDur, 200, 500);
}

// No fallback — null INP means no PerformanceEventTiming data was available.
// The 0 fallback was masking missing data and getting filtered by statistics bounds.

// LCP: real largest-contentful-paint entries first
if (result.lcp === null && cwv.lcp.length > 0) {
  var last = cwv.lcp[cwv.lcp.length - 1];
  if (last.startTime > 0) {
    result.lcp = last.startTime;
    result.lcpRating = rate(last.startTime, 2500, 4000);
  }
}

// LCP fallback: performance.mark from app code (most reliable on extension pages)
if (result.lcp === null) {
  try {
    var marks = performance.getEntriesByName('mm-hero-painted', 'mark');
    if (marks.length > 0) {
      var markTime = marks[marks.length - 1].startTime;
      result.lcp = markTime;
      result.lcpRating = rate(markTime, 2500, 4000);
    }
  } catch(e) {}
}

// CLS: from layout-shift entries
if (result.cls === null && cwv.clsSupported) {
  var clsVal = 0;
  for (var j = 0; j < cwv.cls.length; j++) {
    if (!cwv.cls[j].hadRecentInput) clsVal += cwv.cls[j].value;
  }
  result.cls = clsVal;
  result.clsRating = rate(clsVal, 0.1, 0.25);
}

if (result.cls === null) {
  result.cls = 0;
  result.clsRating = 'good';
}

for (var k = 0; k < cwv.observers.length; k++) cwv.observers[k].disconnect();

// Diagnostic fields — logged by the runner, not included in benchmark output.
// Remove once INP collection is confirmed working.
result.cwvDiagnostic = {
  eventEntryCount: cwv.event.length,
  eventObserverSupported: cwv.eventObserverSupported,
  probeReceived: cwv.probeReceived,
  stateHooksInp: stateHooksInp,
  stateHooksAvailable: !!(sh && sh.getWebVitalsMetrics)
};

delete window.__cwv;

return result;
`;

const CDP_MOUSE_BASE = {
  x: 100,
  y: 100,
  button: 'left' as const,
  clickCount: 1,
};

/**
 * Dispatch a trusted pointer interaction to generate PerformanceEventTiming.
 *
 * Tries Selenium Actions API first (W3C WebDriver protocol, same mechanism
 * used for all other clicks in the test suite), then falls back to CDP
 * `Input.dispatchMouseEvent`. Clicks at (100,100) away from interactive
 * elements. The `pointerdown` busy-wait handler in the setup script ensures
 * non-zero `duration` on the resulting PerformanceEventTiming entry.
 *
 * @param driver - MetaMask Driver wrapper with Selenium driver at `.driver`
 */
async function dispatchINPProbe(driver: Driver): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const innerDriver = (driver as any).driver;
  if (!innerDriver) {
    return;
  }

  // Approach 1: Selenium W3C Actions API
  if (innerDriver.actions) {
    try {
      await innerDriver
        .actions({ async: true })
        .move({ x: CDP_MOUSE_BASE.x, y: CDP_MOUSE_BASE.y })
        .click()
        .perform();
      return;
    } catch {
      // Actions failed — fall through to CDP
    }
  }

  // Approach 2: CDP sendDevToolsCommand (ChromeDriver-specific)
  if (innerDriver.sendDevToolsCommand) {
    try {
      await innerDriver.sendDevToolsCommand('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        ...CDP_MOUSE_BASE,
      });
      await innerDriver.sendDevToolsCommand('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        ...CDP_MOUSE_BASE,
      });
    } catch {
      // CDP unavailable — fall through with whatever entries exist
    }
  }
}

/**
 * Collect web vitals from the running extension.
 *
 * INP: stateHooks (web-vitals `onINP`, running since page startup)
 * is the primary source — it captures real INP from WebDriver
 * interactions during the benchmark. A Selenium Actions probe
 * provides a secondary signal via direct PerformanceObserver entries.
 *
 * FCP: paint timing entries (always available on extension pages).
 * LCP: stateHooks → `largest-contentful-paint` observer →
 * `mm-hero-painted` mark → null.
 * CLS: stateHooks → `layout-shift` observer → 0 fallback.
 *
 * @param driver - Selenium WebDriver instance with access to the extension page
 * @returns Per-run web vitals snapshot (with `cwvDiagnostic` for debugging)
 */
export async function collectWebVitals(
  driver: Driver,
): Promise<WebVitalsMetrics> {
  await driver.executeScript(SETUP_SCRIPT);

  await dispatchINPProbe(driver);

  // Let observer callbacks + PerformanceEventTiming entries settle.
  // 500ms allows the web-vitals library's rAF-deferred processing to complete.
  await driver.delay(500);

  const raw = (await driver.executeScript(READ_SCRIPT)) as WebVitalsMetrics & {
    cwvDiagnostic?: Record<string, unknown>;
  };

  if (raw.cwvDiagnostic) {
    console.info('[web-vitals-collector] diagnostic:', raw.cwvDiagnostic);
    delete raw.cwvDiagnostic;
  }

  return raw;
}
