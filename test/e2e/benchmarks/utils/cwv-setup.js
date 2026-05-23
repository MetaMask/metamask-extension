// Browser-injected script — read as string by web-vitals-collector.ts
const w = window;
w.__cwv = {
  event: [],
  lcp: [],
  cls: [],
  observers: [],
  clsSupported: false,
  eventObserverSupported: false,
  probeReceived: false,
  fcp: null,
};

try {
  const pe = performance.getEntriesByType('paint');
  for (let i = 0; i < pe.length; i++) {
    if (pe[i].name === 'first-contentful-paint') {
      w.__cwv.fcp = pe[i].startTime;
    }
  }
} catch (_e) {
  // paint entries unavailable
}

try {
  const o1 = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (let i = 0; i < entries.length; i++) {
      w.__cwv.event.push(entries[i]);
    }
  });
  o1.observe({ type: 'event', buffered: true, durationThreshold: 0 });
  w.__cwv.eventObserverSupported = true;
  w.__cwv.observers.push(o1);
} catch (_e) {
  // event observer unsupported
}

try {
  document.addEventListener(
    'pointerdown',
    function busyWait() {
      w.__cwv.probeReceived = true;
      const end = performance.now() + 16;
      while (performance.now() < end) {
        // busy-wait to ensure non-zero PerformanceEventTiming duration
      }
    },
    { once: true },
  );
} catch (_e) {
  // pointerdown registration failed
}

try {
  const o2 = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (let i = 0; i < entries.length; i++) {
      w.__cwv.lcp.push(entries[i]);
    }
  });
  o2.observe({ type: 'largest-contentful-paint', buffered: true });
  w.__cwv.observers.push(o2);
} catch (_e) {
  // LCP observer unsupported
}

try {
  const o4 = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (let i = 0; i < entries.length; i++) {
      w.__cwv.cls.push(entries[i]);
    }
  });
  o4.observe({ type: 'layout-shift', buffered: true });
  w.__cwv.clsSupported = true;
  w.__cwv.observers.push(o4);
} catch (_e) {
  // CLS observer unsupported
}
