'use strict';

/**
 * Extension page.evaluate() for eval_sync/eval_async/eval_ref actions.
 *
 * All evals run on the extension's home.html page which has access to
 * window.stateHooks (store, submitRequestToBackground, getPerpsStreamManager).
 */

const { readFileSync, existsSync, readdirSync } = require('node:fs');
const { join, basename } = require('node:path');

const extPageCache = new WeakMap();

async function getExtensionPage(context, extensionId) {
  const cached = extPageCache.get(context);
  if (cached && !cached.isClosed()) return cached;

  const extOrigin = `chrome-extension://${extensionId}`;
  let bestPage;
  for (const page of context.pages()) {
    const url = page.url();
    if (!url.startsWith(extOrigin)) continue;
    if (url.includes('home.html')) { bestPage = page; break; }
    if (!url.includes('offscreen') && !url.includes('snaps')) {
      bestPage = bestPage || page;
    }
  }

  if (bestPage) {
    extPageCache.set(context, bestPage);
    return bestPage;
  }

  const extPage = await context.newPage();
  await extPage.goto(`${extOrigin}/home.html`);
  await extPage.waitForLoadState('domcontentloaded');
  extPageCache.set(context, extPage);
  return extPage;
}

async function evalSync(swPage, expression) {
  return swPage.evaluate((expr) => eval(expr), expression);
}

async function evalAsync(swPage, expression) {
  return swPage.evaluate(async (expr) => await eval(expr), expression);
}

function loadEvalRefs(teamDir) {
  const registry = {};

  const evalsPath = join(teamDir, 'evals.json');
  try { Object.assign(registry, JSON.parse(readFileSync(evalsPath, 'utf-8'))); } catch {}

  const evalsDir = join(teamDir, 'evals');
  if (existsSync(evalsDir)) {
    for (const file of readdirSync(evalsDir).filter((f) => f.endsWith('.json'))) {
      const ns = basename(file, '.json');
      try {
        const entries = JSON.parse(readFileSync(join(evalsDir, file), 'utf-8'));
        for (const [key, entry] of Object.entries(entries)) {
          registry[`${ns}/${key}`] = entry;
        }
      } catch {}
    }
  }

  return registry;
}

async function execEvalRef(ref, registry, swPage) {
  const entry = registry[ref];
  if (!entry) throw new Error(`Unknown eval ref: "${ref}"`);
  return entry.async ? evalAsync(swPage, entry.expression) : evalSync(swPage, entry.expression);
}

module.exports = {
  evalAsync,
  evalSync,
  execEvalRef,
  getExtensionPage,
  loadEvalRefs,
};
