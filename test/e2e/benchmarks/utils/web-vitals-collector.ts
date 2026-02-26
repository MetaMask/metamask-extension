/**
 * Web Vitals collection for E2E benchmarks.
 *
 * Measurement strategy per metric:
 *
 * **INP** — PerformanceObserver (`event` type, `buffered: true`).
 * Captures `PerformanceEventTiming` entries from trusted events.
 * WebDriver actions produce untrusted events that Chrome ignores,
 * so a CDP probe (`Input.dispatchKeyEvent` Shift) generates at least
 * one trusted entry. A 16 ms busy-wait keydown handler ensures the
 * entry has non-zero `duration`. If the `web-vitals` library has
 * already captured INP via `stateHooks`, that value takes priority
 * (it uses the spec-correct 98th percentile algorithm).
 *
 * **FCP** — Read directly from `performance.getEntriesByType('paint')`.
 * Always available on `chrome-extension://` pages.
 *
 * **LCP** — Two-tier fallback:
 *   1. PerformanceObserver (`largest-contentful-paint` type) — real LCP.
 *      Chrome does NOT emit these on `chrome-extension://` pages.
 *   2. Element Timing API (`element` type) — proxy LCP.
 *      The balance wrapper has `elementtiming="hero"`, so Chrome
 *      reports when its text content is first painted. Uses the
 *      entry with the latest `renderTime` as the LCP proxy.
 *
 * **CLS** — PerformanceObserver (`layout-shift` type).
 * Falls back to 0 on extension pages where the observer is unsupported.
 */

import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from './types';

/**
 * Setup script: creates PerformanceObservers, reads FCP, registers
 * a busy-wait keydown handler for the CDP probe.
 * Stores state on `window.__cwv` for the read script.
 */
const SETUP_SCRIPT = `
var w = window;
w.__cwv = {
  event: [], lcp: [], cls: [], element: [],
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
    for (var i = 0; i < e.length; i++) w.__cwv.element.push(e[i]);
  });
  o3.observe({ type: 'element', buffered: true });
  w.__cwv.observers.push(o3);
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
 * Read script: computes metrics from observer entries and paint timing.
 * Checks stateHooks first for web-vitals library values (INP uses
 * spec-correct 98th percentile), then reads raw observer entries.
 * FCP is always read from paint entries. LCP uses real
 * `largest-contentful-paint` entries first, then Element Timing
 * entries (`elementtiming="hero"`) as fallback on extension pages.
 */
const READ_SCRIPT = `
var cwv = window.__cwv || {
  event: [], lcp: [], cls: [], element: [], observers: [], clsSupported: false, fcp: null
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

// Check stateHooks for web-vitals library values (more accurate for INP)
var sh = window.stateHooks;
if (sh && sh.getWebVitalsMetrics) {
  var m = sh.getWebVitalsMetrics();
  if (m.inp !== null) { result.inp = m.inp; result.inpRating = m.inpRating; }
  if (m.lcp !== null) { result.lcp = m.lcp; result.lcpRating = m.lcpRating; }
  if (m.cls !== null) { result.cls = m.cls; result.clsRating = m.clsRating; }
  sh.resetWebVitalsMetrics && sh.resetWebVitalsMetrics();
}

// INP: from PerformanceObserver event entries (primary measurement path)
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

// LCP: real largest-contentful-paint entries first
if (result.lcp === null && cwv.lcp.length > 0) {
  var last = cwv.lcp[cwv.lcp.length - 1];
  if (last.startTime > 0) {
    result.lcp = last.startTime;
    result.lcpRating = rate(last.startTime, 2500, 4000);
  }
}

// LCP fallback: Element Timing API (elementtiming="hero" on balance wrapper)
if (result.lcp === null && cwv.element.length > 0) {
  var maxRender = 0;
  for (var ei = 0; ei < cwv.element.length; ei++) {
    var rt = cwv.element[ei].renderTime || cwv.element[ei].loadTime || 0;
    if (rt > maxRender) maxRender = rt;
  }
  if (maxRender > 0) {
    result.lcp = maxRender;
    result.lcpRating = rate(maxRender, 2500, 4000);
  }
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
 * Collect web vitals from the running extension.
 *
 * Primary measurement: PerformanceObserver for INP (`event` entries),
 * FCP (paint entries), CLS (`layout-shift` entries).
 * CDP probe dispatches a trusted Shift key to generate INP entries.
 * `stateHooks` values from the web-vitals library override observer
 * results when available (more accurate INP computation).
 *
 * LCP is attempted via `largest-contentful-paint` observer, with
 * Element Timing (`elementtiming="hero"`) as fallback on extension pages.
 *
 * @param driver - Selenium WebDriver instance with access to the extension page
 * @returns Per-run web vitals snapshot
 */
export async function collectWebVitals(
  driver: Driver,
): Promise<WebVitalsMetrics> {
  // Set up PerformanceObservers + read FCP + register busy-wait handler
  await driver.executeScript(SETUP_SCRIPT);

  // Dispatch trusted CDP keyboard event to generate PerformanceEventTiming
  await dispatchCDPProbe(driver);

  // Let observer callbacks deliver buffered + probe entries
  await driver.delay(200);

  // Read entries, compute metrics, disconnect observers
  return (await driver.executeScript(READ_SCRIPT)) as WebVitalsMetrics;
}
