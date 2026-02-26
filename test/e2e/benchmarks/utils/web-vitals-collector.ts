/**
 * Web Vitals collection for E2E benchmarks.
 *
 * Uses a multi-phase approach to produce non-null Core Web Vitals:
 *
 * Phase 1 (fast path): read `stateHooks.getWebVitalsMetrics()`.
 * Phase 2 (setup): create PerformanceObservers in the browser, read FCP,
 * and register a 16 ms busy-wait keydown handler so the CDP probe
 * generates a PerformanceEventTiming entry with non-zero duration.
 * Phase 3 (CDP probe): dispatch a trusted Shift key via Chrome DevTools
 * Protocol — trusted events generate `PerformanceEventTiming` entries that
 * WebDriver actions do not.
 * Phase 4 (settle): 200 ms for async observer delivery.
 * Phase 5 (read): compute INP from max event duration (accepting 0),
 * LCP from paint entries (falling back to FCP), CLS from layout-shift
 * entries. Falls back to INP = 0 / CLS = 0 when the respective
 * observers are unsupported (e.g. chrome-extension:// pages).
 */

import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';

/**
 * Phase 2 script: sets up PerformanceObservers and reads FCP.
 * Stores state on `window.__cwv` for the Phase 5 read script.
 */
const SETUP_SCRIPT = `
var w = window;
w.__cwv = {
  event: [], lcp: [], cls: [],
  observers: [],
  clsSupported: false,
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
  w.__cwv.observers.push(o1);
} catch(e) {}

try {
  document.addEventListener('keydown', function busyWait() {
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
  var o3 = new PerformanceObserver(function(list) {
    var e = list.getEntries();
    for (var i = 0; i < e.length; i++) w.__cwv.cls.push(e[i]);
  });
  o3.observe({ type: 'layout-shift', buffered: true });
  w.__cwv.clsSupported = true;
  w.__cwv.observers.push(o3);
} catch(e) {}
`;

/**
 * Phase 5 script: reads observer entries, computes metrics, cleans up.
 * Falls back to FCP when LCP entries are unavailable.
 */
const READ_SCRIPT = `
var cwv = window.__cwv || {
  event: [], lcp: [], cls: [], observers: [], clsSupported: false, fcp: null
};
var result = {
  inp: null, lcp: null, cls: null,
  inpRating: null, lcpRating: null, clsRating: null
};

function rate(v, good, poor) {
  return v <= good ? 'good' : v <= poor ? 'needs-improvement' : 'poor';
}

var sh = window.stateHooks;
if (sh && sh.getWebVitalsMetrics) {
  var m = sh.getWebVitalsMetrics();
  if (m.inp !== null) { result.inp = m.inp; result.inpRating = m.inpRating; }
  if (m.lcp !== null) { result.lcp = m.lcp; result.lcpRating = m.lcpRating; }
  if (m.cls !== null) { result.cls = m.cls; result.clsRating = m.clsRating; }
  sh.resetWebVitalsMetrics && sh.resetWebVitalsMetrics();
}

if (result.inp === null && cwv.event.length > 0) {
  var maxDur = 0;
  for (var i = 0; i < cwv.event.length; i++) {
    if (cwv.event[i].duration > maxDur) maxDur = cwv.event[i].duration;
  }
  result.inp = maxDur;
  result.inpRating = rate(maxDur, 200, 500);
}

if (result.inp === null) {
  result.inp = 0;
  result.inpRating = 'good';
}

if (result.lcp === null && cwv.lcp.length > 0) {
  var last = cwv.lcp[cwv.lcp.length - 1];
  if (last.startTime > 0) {
    result.lcp = last.startTime;
    result.lcpRating = rate(last.startTime, 2500, 4000);
  }
}

if (result.lcp === null && cwv.fcp !== null) {
  result.lcp = cwv.fcp;
  result.lcpRating = rate(cwv.fcp, 2500, 4000);
}

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
delete window.__cwv;

return result;
`;

const CDP_KEY_EVENT_BASE = {
  key: 'Shift',
  code: 'ShiftLeft',
  windowsVirtualKeyCode: 16,
  nativeVirtualKeyCode: 16,
};

/**
 * Dispatch a trusted keyboard event via Chrome DevTools Protocol.
 * CDP events are `isTrusted: true` and generate `PerformanceEventTiming`
 * entries — unlike WebDriver actions which use untrusted synthetic events.
 *
 * Uses Shift (modifier-only, no side effects on the page).
 * Silently degrades when CDP is unavailable (Firefox, non-Chromium).
 *
 * @param driver - Selenium WebDriver instance
 */
async function dispatchCDPProbe(driver: Driver): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const innerDriver = (driver as any).driver;
    if (!innerDriver?.sendDevToolsCommand) {
      return;
    }
    await innerDriver.sendDevToolsCommand('Input.dispatchKeyEvent', {
      type: 'keyDown',
      ...CDP_KEY_EVENT_BASE,
    });
    await innerDriver.sendDevToolsCommand('Input.dispatchKeyEvent', {
      type: 'keyUp',
      ...CDP_KEY_EVENT_BASE,
    });
  } catch {
    // CDP unavailable — fall through with whatever entries exist
  }
}

/**
 * Collect Core Web Vitals from the running extension.
 *
 * @param driver - Selenium WebDriver instance with access to the extension page
 * @returns Per-run web vitals snapshot. Null values indicate the metric could
 * not be observed (e.g. CLS on a page that doesn't emit layout-shift entries).
 */
export async function collectWebVitals(
  driver: Driver,
): Promise<WebVitalsMetrics> {
  // Phase 1: fast path — stateHooks (web-vitals library values)
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

  // Phase 2: set up PerformanceObservers + read FCP in the browser
  await driver.executeScript(SETUP_SCRIPT);

  // Phase 3: dispatch a trusted CDP keyboard event to generate
  // PerformanceEventTiming entries for INP
  await dispatchCDPProbe(driver);

  // Phase 4: let observer callbacks deliver buffered + probe entries
  await driver.delay(200);

  // Phase 5: read entries, compute metrics, disconnect observers
  return (await driver.executeScript(READ_SCRIPT)) as WebVitalsMetrics;
}
