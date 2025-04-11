const globalToPackage = {};

const suggestedDefaults = [
  // ecmascript
  'globalThis',
  'WeakRef',
  'FinalizationRegistry',
  'Error',
  'AggregateError',
  // common (nodejs + browser)
  'console',
  'TextEncoder',
  'TextDecoder',
  'atob',
  'btoa',
  'URL',
  'URLSearchParams',
  'Headers',
  'FormData',
  'Response',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'setImmediate',
  'clearImmediate',
  'queueMicrotask',
  'AbortController',
  'AbortSignal',
  // browser
  'self',
  'window',
  // cjs
  '__dirname',
  '__filename',
  // amd/umd
  'define',
]

const stats = {
  savedEntries: 0,
  totalEntries: 0,
}


analyzePolicy('app/main', require('./browserify/main/policy.json'));
analyzePolicy('app/flask', require('./browserify/flask/policy.json'));
analyzePolicy('app/beta', require('./browserify/beta/policy.json'));
analyzePolicy('app/mmi', require('./browserify/mmi/policy.json'));
analyzePolicy('app/override', require('./browserify/policy-override.json'));

analyzePolicy('build/main', require('./build-system/policy.json'));
analyzePolicy('build/override', require('./build-system/policy-override.json'));

const ouput = {
  stats,
  suggestedDefaults,
  globalToPackage,
}
console.log(JSON.stringify(ouput, null, 2))
Object.entries(globalToPackage)
  .sort(([_,a], [_2,b]) => b.length - a.length)
  .forEach(([key, packages]) => {
    console.error(`${key}: ${packages.length}`);
  }
);


function analyzePolicy(label, policy) {
  for (const [packageName, packagePolicy] of Object.entries(policy.resources)) {
    const globals = packagePolicy.globals || {};
    const globalKeys = Object.keys(globals);
    for (const keyPath of globalKeys) {
      const key = keyPathToTopLevel(keyPath);
      if (suggestedDefaults.includes(key)) {
        stats.savedEntries++;
      }
      stats.totalEntries++;
    }
    const topLevelGlobalKeys = unique(globalKeys.map(keyPathToTopLevel));
    for (const key of topLevelGlobalKeys) {
      const packageLabel = `${label}:${packageName}`;
      const packagesForGlobal = globalToPackage[key] || [];
      packagesForGlobal.push(packageLabel);
      globalToPackage[key] = packagesForGlobal;
    }
  }
  stats.savedEntriesPercent = (100 * stats.savedEntries / stats.totalEntries).toFixed(2);
}

function keyPathToTopLevel(keyPath) {
  return keyPath.split('.')[0];
}

function unique(arr) {
  return Array.from(new Set(arr));
}