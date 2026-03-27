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
