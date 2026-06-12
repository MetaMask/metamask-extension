// Browser-injected script — read as string by web-vitals-collector.ts
const cwv = window.__cwv || {
  event: [],
  lcp: [],
  cls: [],
  observers: [],
  clsSupported: false,
  eventObserverSupported: false,
  probeReceived: false,
  fcp: null,
};
const result = {
  inp: null,
  fcp: null,
  lcp: null,
  cls: null,
  inpRating: null,
  fcpRating: null,
  lcpRating: null,
  clsRating: null,
};

function rate(v, good, poor) {
  if (v <= good) {
    return 'good';
  }
  return v <= poor ? 'needs-improvement' : 'poor';
}

// FCP: always read from paint entries (available on extension pages)
if (cwv.fcp !== null) {
  result.fcp = cwv.fcp;
  result.fcpRating = rate(cwv.fcp, 1800, 3000);
}

// Check stateHooks for INP/FCP/LCP/CLS from web-vitals library.
// The onINP observer has been running since page startup with
// { reportAllChanges: true }, so it captures real benchmark interactions.
const sh = window.stateHooks;
let stateHooksInp = null;
if (sh && sh.getWebVitalsMetrics) {
  const m = sh.getWebVitalsMetrics();
  if (m.inp !== null) {
    stateHooksInp = m.inp;
    result.inp = m.inp;
    result.inpRating = m.inpRating;
  }
  if (m.fcp !== null) {
    result.fcp = m.fcp;
    result.fcpRating = m.fcpRating;
  }
  if (m.lcp !== null) {
    result.lcp = m.lcp;
    result.lcpRating = m.lcpRating;
  }
  if (m.cls !== null) {
    result.cls = m.cls;
    result.clsRating = m.clsRating;
  }
  if (sh.resetWebVitalsMetrics) {
    sh.resetWebVitalsMetrics();
  }
}

// INP fallback: direct PerformanceObserver event entries (probe + buffered)
// Only set when maxDur > 0 — all-zero durations (passive listeners, pre-registration)
// means no meaningful interaction data; keep null to avoid masking missing data.
if (result.inp === null && cwv.event.length > 0) {
  let maxDur = 0;
  for (let i = 0; i < cwv.event.length; i++) {
    if (cwv.event[i].duration > maxDur) {
      maxDur = cwv.event[i].duration;
    }
  }
  if (maxDur > 0) {
    result.inp = maxDur;
    result.inpRating = rate(maxDur, 200, 500);
  }
}

// LCP: real largest-contentful-paint entries first
if (result.lcp === null && cwv.lcp.length > 0) {
  const last = cwv.lcp[cwv.lcp.length - 1];
  if (last.startTime > 0) {
    result.lcp = last.startTime;
    result.lcpRating = rate(last.startTime, 2500, 4000);
  }
}

// LCP fallback: performance.mark from app code (most reliable on extension pages)
if (result.lcp === null) {
  try {
    const marks = performance.getEntriesByName('mm-hero-painted', 'mark');
    if (marks.length > 0) {
      const markTime = marks[marks.length - 1].startTime;
      result.lcp = markTime;
      result.lcpRating = rate(markTime, 2500, 4000);
    }
  } catch (_e) {
    // mark lookup failed
  }
}

// CLS: from layout-shift entries (sum non-recent-input shifts).
// When clsSupported but no entries, clsVal stays 0 (perfect stability).
// When !clsSupported, keep null — observer didn't fire.
if (result.cls === null && cwv.clsSupported) {
  let clsVal = 0;
  for (let j = 0; j < cwv.cls.length; j++) {
    if (!cwv.cls[j].hadRecentInput) {
      clsVal += cwv.cls[j].value;
    }
  }
  result.cls = clsVal;
  result.clsRating = rate(clsVal, 0.1, 0.25);
}

for (let k = 0; k < cwv.observers.length; k++) {
  cwv.observers[k].disconnect();
}

// Diagnostic fields — logged by the runner, not included in benchmark output.
// Remove once INP collection is confirmed working.
let supportedTypes = [];
try {
  supportedTypes = PerformanceObserver.supportedEntryTypes || [];
} catch (_e) {
  // PerformanceObserver unavailable
}
result.cwvDiagnostic = {
  supportedEntryTypes: supportedTypes,
  eventEntryCount: cwv.event.length,
  eventObserverSupported: cwv.eventObserverSupported,
  clsSupported: cwv.clsSupported,
  clsEntryCount: cwv.cls.length,
  probeReceived: cwv.probeReceived,
  stateHooksInp,
  stateHooksAvailable: Boolean(sh && sh.getWebVitalsMetrics),
};

delete window.__cwv;

return result;
