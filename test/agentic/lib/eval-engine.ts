/**
 * Service worker page.evaluate() for eval_sync/eval_async/eval_ref actions.
 *
 * Extension pages are restricted by LavaMoat (no setInterval/setTimeout).
 * The service worker page is unrestricted — all evals go there.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import type { BrowserContext, Page } from '@playwright/test';

export type EvalRef = {
  description: string;
  expression: string;
  async: boolean;
};

// Cache service worker pages per context to avoid repeated lookups
const swPageCache = new WeakMap<BrowserContext, Page>();

/**
 * Find the service worker page for the extension in the given browser context.
 * Caches the result per BrowserContext.
 * @param context
 * @param extensionId
 */
export async function getServiceWorkerPage(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const cached = swPageCache.get(context);
  if (cached && !cached.isClosed()) {
    return cached;
  }

  const extOrigin = `chrome-extension://${extensionId}`;

  // Prefer an existing extension page that has chrome.storage.local access.
  // home.html is a regular page context with full extension API access.
  // offscreen.html may lack chrome.storage in CDP mode.
  // Priority: home.html > any other extension page (skip offscreen/snaps)
  let bestPage: Page | undefined;
  for (const page of context.pages()) {
    const url = page.url();
    if (!url.startsWith(extOrigin)) {
      continue;
    }
    if (url.includes('home.html')) {
      bestPage = page;
      break;
    }
    if (!url.includes('offscreen') && !url.includes('snaps')) {
      bestPage = bestPage ?? page;
    }
  }

  if (bestPage) {
    swPageCache.set(context, bestPage);
    return bestPage;
  }

  // Fallback: open home.html (has full chrome.storage.local access)
  const swPage = await context.newPage();
  await swPage.goto(`${extOrigin}/home.html`);
  await swPage.waitForLoadState('domcontentloaded');
  swPageCache.set(context, swPage);
  return swPage;
}

/**
 * Execute a synchronous expression on the service worker page.
 * @param swPage
 * @param expression
 */
export async function evalSync(
  swPage: Page,
  expression: string,
): Promise<unknown> {
  return swPage.evaluate((expr: string) => {
    // eslint-disable-next-line no-eval
    return eval(expr);
  }, expression);
}

/**
 * Execute an async expression on the service worker page.
 * The expression should return a Promise.
 * @param swPage
 * @param expression
 */
export async function evalAsync(
  swPage: Page,
  expression: string,
): Promise<unknown> {
  return swPage.evaluate(async (expr: string) => {
    // eslint-disable-next-line no-eval
    return await eval(expr);
  }, expression);
}

/**
 * Load eval refs from a team's evals.json file.
 * @param teamDir
 */
export function loadEvalRefs(teamDir: string): Record<string, EvalRef> {
  const registry: Record<string, EvalRef> = {};

  // Load top-level evals.json
  const evalsPath = join(teamDir, 'evals.json');
  try {
    Object.assign(registry, JSON.parse(readFileSync(evalsPath, 'utf-8')));
  } catch {
    // No top-level evals.json
  }

  // Load evals/*.json sub-files → namespace as "subfile/key"
  const evalsDir = join(teamDir, 'evals');
  if (existsSync(evalsDir)) {
    for (const file of readdirSync(evalsDir).filter((f) => f.endsWith('.json'))) {
      const ns = basename(file, '.json');
      try {
        const entries = JSON.parse(readFileSync(join(evalsDir, file), 'utf-8'));
        for (const [key, entry] of Object.entries(entries)) {
          registry[`${ns}/${key}`] = entry as EvalRef;
        }
      } catch {
        // Skip invalid sub-file
      }
    }
  }

  return registry;
}

/**
 * Execute an eval ref by name, looking it up from the registry.
 * @param ref
 * @param registry
 * @param swPage
 */
export async function execEvalRef(
  ref: string,
  registry: Record<string, EvalRef>,
  swPage: Page,
): Promise<unknown> {
  const entry = registry[ref];
  if (!entry) {
    throw new Error(`Unknown eval ref: "${ref}"`);
  }
  if (entry.async) {
    return evalAsync(swPage, entry.expression);
  }
  return evalSync(swPage, entry.expression);
}
