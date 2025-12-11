export const createSelectorPerfTracker = (name, logIntervalMs = 5000) => {
  const stats = {
    selectorCalls: 0,
    resultFnCalls: 0,
    lastLogTime: Date.now(),
    mode: 'UNKNOWN',
  };

  const reset = () => {
    stats.selectorCalls = 0;
    stats.resultFnCalls = 0;
    stats.lastLogTime = Date.now();
    console.log(`[${name}] Stats reset`);
  };

  const getStats = () => {
    const cacheHits =
      stats.selectorCalls > 0 ? stats.selectorCalls - stats.resultFnCalls : 0;
    const cacheRate =
      stats.selectorCalls > 0
        ? ((cacheHits / stats.selectorCalls) * 100).toFixed(1)
        : '0.0';
    return { ...stats, cacheHits, cacheRate };
  };

  const logStats = (force = false) => {
    const now = Date.now();
    if (force || now - stats.lastLogTime > logIntervalMs) {
      const { cacheHits, cacheRate } = getStats();
      console.log(
        `[${name} ${stats.mode}] ` +
          `Calls: ${stats.selectorCalls}, ` +
          `Computed: ${stats.resultFnCalls}, ` +
          `Cached: ${cacheHits} (${cacheRate}%)`,
      );
      stats.lastLogTime = now;
    }
  };

  const trackSelectorCall = () => {
    stats.selectorCalls += 1;
    logStats();
  };

  const trackResultFnCall = () => {
    stats.resultFnCalls += 1;
  };

  const setMode = (mode) => {
    stats.mode = mode;
    reset();
  };

  return {
    stats,
    reset,
    getStats,
    logStats,
    trackSelectorCall,
    trackResultFnCall,
    setMode,
  };
};

const perfTrackerRegistry = {};

export const getOrCreatePerfTracker = (name, logIntervalMs = 5000) => {
  if (!perfTrackerRegistry[name]) {
    perfTrackerRegistry[name] = createSelectorPerfTracker(name, logIntervalMs);
  }
  return perfTrackerRegistry[name];
};

export const getAllPerfTrackers = () => perfTrackerRegistry;

export const logAllPerfStats = () => {
  Object.values(perfTrackerRegistry).forEach((tracker) =>
    tracker.logStats(true),
  );
};

export const resetAllPerfStats = () => {
  Object.values(perfTrackerRegistry).forEach((tracker) => tracker.reset());
};

if (typeof window !== 'undefined') {
  window.ogpPerf = {
    trackers: perfTrackerRegistry,
    logAll: logAllPerfStats,
    resetAll: resetAllPerfStats,
    getTracker: (name) => perfTrackerRegistry[name],
  };
}
