'use strict';

/**
 * Pre-condition evaluation engine.
 * Evaluates named pre-conditions before recipe steps run. Fails fast with hints.
 */

async function runPreConditions(conditions, registries, callHandler, context) {
  const results = [];

  for (const condition of conditions) {
    const name = typeof condition === 'string' ? condition : condition.name;
    const params = typeof condition === 'object'
      ? Object.fromEntries(Object.entries(condition).filter(([k]) => k !== 'name'))
      : undefined;

    let entry;
    for (const registry of registries) {
      if (registry[name]) { entry = registry[name]; break; }
    }

    if (!entry) {
      results.push({ name, pass: false, hint: `Unknown pre-condition: "${name}"`, durationMs: 0 });
      return { allPassed: false, results };
    }

    const start = Date.now();
    try {
      const result = await entry.check(callHandler, params, context);
      const durationMs = Date.now() - start;
      results.push({ name, pass: result.pass, hint: result.hint, durationMs });

      if (!result.pass) return { allPassed: false, results };
    } catch (err) {
      const durationMs = Date.now() - start;
      results.push({
        name,
        pass: false,
        hint: `Pre-condition threw: ${err instanceof Error ? err.message : String(err)}`,
        durationMs,
      });
      return { allPassed: false, results };
    }
  }

  return { allPassed: true, results };
}

module.exports = { runPreConditions };
