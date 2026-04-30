'use strict';

/**
 * ext-bridge.js — Extension action execution adapter.
 *
 * Maps workflow node actions to Playwright Page / MCP callHandler invocations.
 * Thin adapter: all assertion logic lives in assert.js, all graph traversal in workflow.js.
 */

const { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } = require('node:fs');
const { join, dirname, basename } = require('node:path');
const { checkAssert } = require('./assert');
const { renderTemplate, renderTemplateString } = require('./catalog');
const { ROUTE_MAP, routeToHash } = require('./route-map');

// ── Eval helpers (extension page) ────────────────────────────────────

const extPageCache = new WeakMap();

async function getExtensionPage(context, extensionId) {
  const cached = extPageCache.get(context);
  if (cached && !cached.isClosed()) {
    return cached;
  }

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

async function getEvalPage(ctx, target = 'extension') {
  const activePage = ctx.getPage?.();
  if (activePage && !activePage.isClosed()) {
    if (target === 'active') {
      return activePage;
    }

    if (activePage.url().startsWith(`chrome-extension://${ctx.extensionId}/`)) {
      return activePage;
    }
  }

  if (target === 'active') {
    throw new Error('eval target "active" requested but no active page is available');
  }

  if (
    activePage &&
    !activePage.isClosed() &&
    activePage.url().startsWith(`chrome-extension://${ctx.extensionId}/`)
  ) {
    return activePage;
  }

  return getExtensionPage(ctx.getContext(), ctx.extensionId);
}

async function evalSync(swPage, expression) {
  return swPage.evaluate((expr) => eval(expr), expression);
}

async function evalAsync(swPage, expression) {
  return swPage.evaluate(async (expr) => await eval(expr), expression);
}

// ── Eval ref loading ─────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fromResponse(resp) {
  if (resp.ok) return { raw: resp.result, ok: true };
  return { raw: null, ok: false, error: resp.error.message };
}

function resolveNavigateParams(target, hash, node) {
  if (target === 'PerpsMarketDetails') {
    const symbol = node.params?.market?.symbol || node.params?.symbol || '';
    if (symbol) return `#/perps/market/${symbol}`;
  }
  if (target === 'PerpsOrderEntry' && node.params) {
    const symbol = node.params?.market?.symbol || node.params?.symbol || '';
    const direction = node.params.direction || 'long';
    return `#/perps/trade/${symbol}?direction=${direction}&mode=new`;
  }
  return hash;
}

// ── Action execution ─────────────────────────────────────────────────

/**
 * Execute a single node action. Returns { raw, ok, error? }.
 *
 * @param {object} node - Workflow node (action, test_id, ref, params, etc.)
 * @param {object} ctx  - Execution context
 * @param {Function} ctx.callHandler - MCP tool handler
 * @param {string} ctx.extensionId
 * @param {string} ctx.recipesDir
 * @param {string} ctx.teamDir
 * @param {object} ctx.evalRegistry
 * @param {object} ctx.params
 * @param {boolean} ctx.skipManual
 * @param {Set} ctx.callStack - Circular reference detection for `call` action
 * @param {Function} ctx.getPage
 * @param {Function} ctx.getContext
 * @param {Function} [ctx.executeWorkflow] - For recursive `call` action (injected by runner)
 */
async function executeNodeAction(node, ctx) {
  switch (node.action) {
    case 'press':
      return fromResponse(await ctx.callHandler('mm_click', { testId: node.test_id }));

    case 'set_input':
      return handleSetInput(node, ctx);

    case 'type_keypad':
      return fromResponse(
        await ctx.callHandler('mm_type', { testId: node.test_id, text: node.value || '' }),
      );

    case 'clear_keypad':
      return fromResponse(
        await ctx.callHandler('mm_type', { testId: node.test_id, text: '' }),
      );

    case 'navigate':
      return handleNavigate(node, ctx);

    case 'wait':
      await delay(node.ms || 1000);
      return { raw: null, ok: true };

    case 'wait_for':
      return handleWaitFor(node, ctx);

    case 'screenshot':
      return fromResponse(
        await ctx.callHandler('mm_screenshot', { name: node.filename || node.id }),
      );

    case 'eval_sync':
      return handleEvalSync(node, ctx);

    case 'eval_async':
      return handleEvalAsync(node, ctx);

    case 'eval_ref':
      return handleEvalRef(node, ctx);

    case 'call':
      return handleCall(node, ctx);

    case 'log_watch':
      return handleLogWatch(node, ctx);

    case 'cdp_probe':
      return handleCdpProbe(node, ctx);

    case 'network':
      return handleNetwork(node, ctx);

    case 'emulation':
      return handleEmulation(node, ctx);

    case 'storage':
      return handleStorage(node, ctx);

    case 'service_worker':
      return handleServiceWorker(node, ctx);

    case 'target':
      return handleTarget(node, ctx);

    case 'page':
      return handlePage(node, ctx);

    case 'browser':
      return handleBrowser(node, ctx);

    case 'fetch':
      return handleFetch(node, ctx);

    case 'performance':
      return handlePerformance(node, ctx);

    case 'trace_start':
      return handleTraceStart(node, ctx);

    case 'trace_stop':
      return handleTraceStop(node, ctx);

    case 'scroll':
      return handleScroll(node, ctx);

    case 'key_press':
      return handleKeyPress(node, ctx);

    case 'manual':
      return handleManual(node, ctx);

    case 'select_account':
      return handleSelectAccount(node, ctx);

    case 'toggle_testnet':
      return handleToggleTestnet(node, ctx);

    case 'switch_provider':
      return handleSwitchProvider(node, ctx);

    case 'ext_navigate_hash':
      return handleExtNavigateHash(node, ctx);

    case 'ext_wait_for_screen':
      return handleExtWaitForScreen(node, ctx);

    case 'ext_switch_tab':
      return fromResponse(await ctx.callHandler('mm_switch_to_tab', { role: node.role }));

    case 'ext_check_dom':
      return handleExtCheckDom(node, ctx);

    // Control actions handled by the runner, not here
    case 'switch':
    case 'end':
      return { raw: null, ok: true };

    default:
      return { raw: null, ok: false, error: `Unknown action: ${node.action}` };
  }
}

// ── Action implementations ──────────────────────────────────────────

async function handleSetInput(node, ctx) {
  const resp = await ctx.callHandler('mm_type', { testId: node.test_id, text: node.value || '' });
  if (resp.ok) return fromResponse(resp);

  try {
    const page = ctx.getPage();
    const input = page.locator(`[data-testid="${node.test_id}"] input`).first();
    await input.fill(node.value || '', { timeout: 5000 });
    return { raw: { filled: true, fallback: true }, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `set_input failed: ${err.message || err}` };
  }
}

async function handleNavigate(node, ctx) {
  const target = node.target || '';
  let hash = routeToHash(target);

  if (hash) {
    hash = resolveNavigateParams(target, hash, node);
    const page = ctx.getPage();
    const extUrl = `chrome-extension://${ctx.extensionId}/home.html${hash}`;
    await page.goto(extUrl);
    await page.waitForLoadState('domcontentloaded');
    return { raw: { navigated: true, hash }, ok: true };
  }

  if (/^https?:\/\//u.test(target) && ctx.sessionManager && typeof ctx.sessionManager.navigateToUrl === 'function') {
    await ctx.sessionManager.navigateToUrl(target);
    return { raw: { navigated: true, url: target }, ok: true };
  }

  const screenMap = { Home: 'home', Settings: 'settings' };
  const screen = screenMap[target];
  if (screen) return fromResponse(await ctx.callHandler('mm_navigate', { screen }));

  return fromResponse(await ctx.callHandler('mm_navigate', { screen: 'url', url: target }));
}

async function handleWaitFor(node, ctx) {
  const timeout = node.timeout_ms || 10000;
  const poll = node.poll_ms || 500;

  if (node.test_id) {
    if (node.visible === false) {
      const page = ctx.getPage();
      await page.locator(`[data-testid="${node.test_id}"]`).waitFor({ state: 'hidden', timeout });
      return { raw: { found: true, hidden: true }, ok: true };
    }
    return fromResponse(
      await ctx.callHandler('mm_wait_for', { testId: node.test_id, timeoutMs: timeout }),
    );
  }

  if (node.route || node.not_route) {
    const deadline = Date.now() + timeout;
    const page = ctx.getPage();
    while (Date.now() < deadline) {
      const currentHash = new URL(page.url()).hash;
      const currentRoute = currentHash.replace('#/', '') || 'home';
      if (node.route && currentRoute.includes(node.route.toLowerCase())) {
        return { raw: { route: currentRoute }, ok: true };
      }
      if (node.not_route && !currentRoute.includes(node.not_route.toLowerCase())) {
        return { raw: { route: currentRoute }, ok: true };
      }
      await delay(poll);
    }
    return {
      raw: { timeout: true },
      ok: false,
      error: `Timed out waiting for ${node.route ? `route "${node.route}"` : `not_route "${node.not_route}"`}`,
    };
  }

  if (node.expression) {
    const deadline = Date.now() + timeout;
    const swPage = await getEvalPage(ctx, node.target);
    while (Date.now() < deadline) {
      try {
        const result = await evalSync(swPage, node.expression);
        if (node.assert && checkAssert(result, node.assert)) return { raw: result, ok: true };
        if (!node.assert && result) return { raw: result, ok: true };
      } catch {}
      await delay(poll);
    }
    return { raw: { timeout: true }, ok: false, error: `Timed out polling expression for node "${node.id}"` };
  }

  return { raw: null, ok: false, error: `wait_for node "${node.id}" has no target` };
}

async function handleEvalSync(node, ctx) {
  try {
    const swPage = await getEvalPage(ctx, node.target);
    const result = await evalSync(swPage, node.expression || '');
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `eval_sync failed: ${err.message || err}` };
  }
}

async function handleEvalAsync(node, ctx) {
  try {
    const swPage = await getEvalPage(ctx, node.target);
    const result = await evalAsync(swPage, node.expression || '');
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `eval_async failed: ${err.message || err}` };
  }
}

async function handleEvalRef(node, ctx) {
  try {
    const swPage = await getEvalPage(ctx, node.target);
    const result = await execEvalRef(node.ref || '', ctx.evalRegistry, swPage);
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `eval_ref "${node.ref}" failed: ${err.message || err}` };
  }
}

async function handleCall(node, ctx) {
  const ref = node.ref || '';

  if (ctx.callStack.has(ref)) {
    return { raw: null, ok: false, error: `Circular call detected: "${ref}" is already in the call stack` };
  }

  const flowCandidates = [];
  const refParts = String(ref).split('/').filter(Boolean);
  const isBundledRef = refParts[0] === 'bundle' && refParts.length > 1;

  if (ctx.taskArtifactsDir || ctx.artifactsDir) {
    const taskRecipeFlowsDir = join(ctx.taskArtifactsDir || dirname(ctx.artifactsDir), 'recipe-flows');
    if (isBundledRef) {
      const rel = refParts.slice(1).join('/');
      flowCandidates.push(join(taskRecipeFlowsDir, `${rel}.json`));
    } else {
      flowCandidates.push(join(taskRecipeFlowsDir, `${ref}.json`));
    }
  }

  if (!isBundledRef && ref.includes('/')) {
    const collectionsDir = ctx.domainsDirName || 'domains';
    flowCandidates.push(join(ctx.recipesDir, collectionsDir, `${ref.replace('/', '/flows/')}.json`));
  } else if (!isBundledRef) {
    flowCandidates.push(join(ctx.teamDir, 'flows', `${ref}.json`));
  }

  const flowPath = flowCandidates.find((candidate) => {
    try { return existsSync(candidate); } catch { return false; }
  });
  if (!flowPath) {
    return { raw: null, ok: false, error: `Failed to resolve call "${ref}" from task recipe-flows or shared flow catalogs` };
  }

  let flowJson;
  try {
    flowJson = JSON.parse(readFileSync(flowPath, 'utf-8'));
  } catch (err) {
    return { raw: null, ok: false, error: `Failed to load call "${ref}" from ${flowPath}: ${err.message || err}` };
  }

  // Template substitution
  const flowInputs = flowJson.inputs || {};
  const callerParams = node.params || {};
  const mergedParams = { ...Object.fromEntries(
    Object.entries(flowInputs).filter(([, v]) => v.default != null).map(([k, v]) => [k, renderTemplateString(String(v.default), {})])
  ), ...callerParams };
  const substituted = renderTemplate(flowJson, mergedParams);

  const refTeamDir = dirname(dirname(flowPath));
  const subCtx = { ...ctx, teamDir: refTeamDir, callStack: new Set([...ctx.callStack, ref]) };

  if (!substituted.validate?.workflow) {
    return { raw: null, ok: false, error: `call "${ref}" has no validate.workflow` };
  }

  if (!ctx.executeWorkflow) {
    return { raw: null, ok: false, error: `call "${ref}" requires executeWorkflow in context` };
  }

  return ctx.executeWorkflow(substituted, subCtx);
}

async function handleLogWatch(node, ctx) {
  const page = ctx.getPage();
  const windowMs = (node.window_seconds || 5) * 1000;
  const logs = [];
  const violations = [];

  const handler = (msg) => logs.push(msg.text());
  page.on('console', handler);
  await delay(windowMs);
  page.off('console', handler);

  if (node.must_not_appear) {
    for (const pattern of node.must_not_appear) {
      for (const log of logs) {
        if (log.includes(pattern)) violations.push(`Found forbidden pattern "${pattern}" in: ${log}`);
      }
    }
  }

  const watched = [];
  if (node.watch_for) {
    for (const pattern of node.watch_for) {
      if (logs.some((log) => log.includes(pattern))) watched.push(pattern);
    }
  }

  return {
    raw: { logs: logs.length, violations, watched },
    ok: violations.length === 0,
    error: violations.length > 0 ? violations.join('; ') : undefined,
  };
}

async function handleCdpProbe(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.startCdpProbe !== 'function') {
    return { raw: null, ok: false, error: 'cdp_probe requires a session manager with startCdpProbe()' };
  }

  const phase = String(node.phase || '').toLowerCase();
  const safeName = String(node.name || 'default').replaceAll(/[^a-zA-Z0-9_-]/g, '_');
  try {
    if (phase === 'start') {
      let streamNetworkPath = null;
      let streamMessagesPath = null;
      if (node.stream === true && ctx.artifactsDir) {
        mkdirSync(ctx.artifactsDir, { recursive: true });
        streamNetworkPath = join(ctx.artifactsDir, `cdp-probe-${safeName}-network.jsonl`);
        streamMessagesPath = join(ctx.artifactsDir, `cdp-probe-${safeName}-messages.jsonl`);
      }

      const result = await ctx.sessionManager.startCdpProbe({
        name: node.name,
        scope: node.scope,
        url_pattern: node.url_pattern,
        message_pattern: node.message_pattern,
        status_match: node.status_match,
        stream_network_path: streamNetworkPath,
        stream_messages_path: streamMessagesPath,
      });
      return { raw: result, ok: true };
    }
    if (phase === 'stop') {
      const result = await ctx.sessionManager.stopCdpProbe({ name: node.name });
      // Skip jsonl re-writes when streaming — the live files ARE the jsonl.
      if (ctx.artifactsDir) {
        try {
          mkdirSync(ctx.artifactsDir, { recursive: true });
          writeFileSync(
            join(ctx.artifactsDir, `cdp-probe-${safeName}.json`),
            JSON.stringify(result, null, 2),
          );
          const streamed = Boolean(result?.stream?.network || result?.stream?.messages);
          if (!streamed) {
            const full = result._full;
            if (full) {
              const networkLines = (full.requests || [])
                .map((r) => JSON.stringify(r))
                .join('\n');
              const messageLines = (full.messages || [])
                .map((m) => JSON.stringify(m))
                .join('\n');
              writeFileSync(
                join(ctx.artifactsDir, `cdp-probe-${safeName}-network.jsonl`),
                networkLines ? `${networkLines}\n` : '',
              );
              writeFileSync(
                join(ctx.artifactsDir, `cdp-probe-${safeName}-messages.jsonl`),
                messageLines ? `${messageLines}\n` : '',
              );
            }
          }
        } catch {
          // artifact write is best-effort; don't fail the node
        }
      }
      return { raw: result, ok: true };
    }
    return { raw: null, ok: false, error: `cdp_probe: unknown phase "${node.phase}" (expected "start" or "stop")` };
  } catch (err) {
    return { raw: null, ok: false, error: `cdp_probe failed: ${err.message || err}` };
  }
}

async function handleNetwork(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyNetworkProfile !== 'function') {
    return { raw: null, ok: false, error: 'network requires a session manager with applyNetworkProfile()' };
  }

  try {
    const result = await ctx.sessionManager.applyNetworkProfile({
      throttling: node.throttling,
      target: node.target,
      latencyMs: node.latency_ms,
      downloadKbps: node.download_kbps,
      uploadKbps: node.upload_kbps,
      connectionType: node.connection_type,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `network failed: ${err.message || err}` };
  }
}

async function handleEmulation(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyEmulationProfile !== 'function') {
    return { raw: null, ok: false, error: 'emulation requires a session manager with applyEmulationProfile()' };
  }

  try {
    const result = await ctx.sessionManager.applyEmulationProfile({
      emulation: node.emulation,
      rate: node.rate,
      target: node.target,
      colorScheme: node.color_scheme,
      reducedMotion: node.reduced_motion,
      timezoneId: node.timezone_id,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `emulation failed: ${err.message || err}` };
  }
}

async function handleStorage(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyStorageAction !== 'function') {
    return { raw: null, ok: false, error: 'storage requires a session manager with applyStorageAction()' };
  }

  try {
    const result = await ctx.sessionManager.applyStorageAction({
      storage: node.storage,
      origin: node.origin,
      storageTypes: node.storage_types,
      target: node.target,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `storage failed: ${err.message || err}` };
  }
}

async function handleServiceWorker(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyServiceWorkerAction !== 'function') {
    return { raw: null, ok: false, error: 'service_worker requires a session manager with applyServiceWorkerAction()' };
  }

  try {
    const result = await ctx.sessionManager.applyServiceWorkerAction({
      worker: node.worker,
      expression: node.expression,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `service_worker failed: ${err.message || err}` };
  }
}

async function handleTarget(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyTargetAction !== 'function') {
    return { raw: null, ok: false, error: 'target requires a session manager with applyTargetAction()' };
  }

  try {
    const result = await ctx.sessionManager.applyTargetAction({
      targetAction: node.target_action,
      role: node.role,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `target failed: ${err.message || err}` };
  }
}

async function handlePage(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyPageAction !== 'function') {
    return { raw: null, ok: false, error: 'page requires a session manager with applyPageAction()' };
  }

  try {
    const result = await ctx.sessionManager.applyPageAction({
      pageAction: node.page_action,
      target: node.target,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `page failed: ${err.message || err}` };
  }
}

async function handleBrowser(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyBrowserAction !== 'function') {
    return { raw: null, ok: false, error: 'browser requires a session manager with applyBrowserAction()' };
  }

  try {
    const result = await ctx.sessionManager.applyBrowserAction({
      browserAction: node.browser_action,
      permission: node.permission,
      origin: node.origin,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `browser failed: ${err.message || err}` };
  }
}

async function handleFetch(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyFetchAction !== 'function') {
    return { raw: null, ok: false, error: 'fetch requires a session manager with applyFetchAction()' };
  }

  try {
    const result = await ctx.sessionManager.applyFetchAction({
      fetchAction: node.fetch_action,
      urlPattern: node.url_pattern,
      errorReason: node.error_reason,
      target: node.target,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `fetch failed: ${err.message || err}` };
  }
}

async function handlePerformance(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.applyPerformanceAction !== 'function') {
    return { raw: null, ok: false, error: 'performance requires a session manager with applyPerformanceAction()' };
  }

  try {
    const result = await ctx.sessionManager.applyPerformanceAction({
      performanceAction: node.performance_action,
      target: node.target,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `performance failed: ${err.message || err}` };
  }
}

async function handleTraceStart(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.startTraceCapture !== 'function') {
    return { raw: null, ok: false, error: 'trace_start requires a session manager with startTraceCapture()' };
  }

  try {
    const result = await ctx.sessionManager.startTraceCapture({
      label: node.label,
      target: node.target,
      categories: node.categories,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `trace_start failed: ${err.message || err}` };
  }
}

async function handleTraceStop(node, ctx) {
  if (!ctx.sessionManager || typeof ctx.sessionManager.stopTraceCapture !== 'function') {
    return { raw: null, ok: false, error: 'trace_stop requires a session manager with stopTraceCapture()' };
  }

  try {
    const result = await ctx.sessionManager.stopTraceCapture({
      label: node.label,
      filename: node.filename,
    });
    return { raw: result, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `trace_stop failed: ${err.message || err}` };
  }
}

async function handleScroll(node, ctx) {
  const page = ctx.getPage();
  if (node.test_id) {
    await page.locator(`[data-testid="${node.test_id}"]`).scrollIntoViewIfNeeded();
  } else {
    await page.mouse.wheel(0, node.offset || 300);
  }
  return { raw: null, ok: true };
}

// key_press — dispatch a keyboard event (keydown+keyup) via Playwright/CDP.
// Accepts Playwright key syntax: single keys ("Enter", "Escape", "Tab", "a")
// or chords ("Control+a", "Shift+Tab"). If test_id is provided, the matching
// element is focused first so the event routes through it.
async function handleKeyPress(node, ctx) {
  const key = node.key;
  if (!key) return { raw: null, ok: false, error: 'key_press requires a "key" field' };
  try {
    const page = ctx.getPage();
    if (node.test_id) {
      const locator = page.locator(`[data-testid="${node.test_id}"]`).first();
      await locator.waitFor({ state: 'visible', timeout: node.timeout_ms || 5000 });
      await locator.press(key, { delay: node.delay_ms || 0 });
    } else {
      await page.keyboard.press(key, { delay: node.delay_ms || 0 });
    }
    return { raw: { pressed: key, test_id: node.test_id || null }, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `key_press failed: ${err.message || err}` };
  }
}

async function handleManual(node, ctx) {
  if (ctx.skipManual) {
    process.stdout.write(`  [SKIP] Manual node "${node.id}": ${node.note || 'no note'}\n`);
    return { raw: { skipped: true }, ok: true };
  }

  process.stdout.write(`\n  MANUAL: ${node.note || node.id}\n`);
  process.stdout.write('     Press Enter to continue...');

  await new Promise((resolve) => {
    const onData = () => { process.stdin.off('data', onData); resolve(); };
    process.stdin.on('data', onData);
  });

  return { raw: { manual: true }, ok: true };
}

// --skip-manual short-circuits step waits so CI can run step-mode recipes non-interactively.
async function waitForAdvance(ctx) {
  const playback = ctx.playback || { mode: 'off', slow_ms: 1000 };

  if (playback.mode === 'auto') {
    await delay(playback.slow_ms);
    return;
  }

  if (playback.mode !== 'step') return;
  if (ctx.skipManual) return;

  // Consume a queued click that arrived before this step's wait started
  // (HUD button can fire between post-action hudUpdate and the next pre-action pause).
  if (ctx.__stepPending) {
    ctx.__stepPending = false;
    return;
  }

  process.stdout.write('  [step] Press Enter or click Next → ');

  await new Promise((resolve) => {
    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      process.stdin.off('data', onData);
      ctx.__stepAdvance = null;
      process.stdout.write('\n');
      resolve();
    };
    const onData = () => cleanup();
    process.stdin.on('data', onData);
    ctx.__stepAdvance = cleanup;
  });
}

async function handleSelectAccount(node, ctx) {
  let resp = await ctx.callHandler('mm_click', { testId: 'account-menu-icon' });
  if (!resp.ok) return fromResponse(resp);

  await delay(500);

  if (node.address) {
    const page = ctx.getPage();
    const short = `${node.address.slice(0, 6)}...${node.address.slice(-4)}`;
    try {
      await page.locator(`text=${short}`).first().click({ timeout: 5000 });
    } catch {
      return { raw: null, ok: false, error: `Could not find account with address ${node.address}` };
    }
  }

  return { raw: { selected: node.address }, ok: true };
}

async function handleToggleTestnet(node, ctx) {
  const page = ctx.getPage();
  try {
    await page.evaluate(
      "stateHooks.submitRequestToBackground('perpsToggleTestnet', [])",
    );
    return { raw: { toggled: true }, ok: true };
  } catch (err) {
    return { raw: null, ok: false, error: `toggle_testnet failed: ${err.message || err}` };
  }
}

async function handleSwitchProvider(node, ctx) {
  const page = ctx.getPage();
  const extUrl = `chrome-extension://${ctx.extensionId}/home.html#/settings/networks`;
  await page.goto(extUrl);
  await page.waitForLoadState('domcontentloaded');
  await delay(1000);

  if (node.provider) {
    try {
      await page.locator(`text=${node.provider}`).first().click({ timeout: 5000 });
      return { raw: { switched: node.provider }, ok: true };
    } catch {
      return { raw: null, ok: false, error: `Could not find provider "${node.provider}"` };
    }
  }

  return { raw: null, ok: false, error: 'No provider specified' };
}

async function handleExtNavigateHash(node, ctx) {
  const page = ctx.getPage();
  const hash = node.hash || '';
  const extUrl = `chrome-extension://${ctx.extensionId}/home.html#/${hash.replace(/^\//, '')}`;
  await page.goto(extUrl);
  await page.waitForLoadState('domcontentloaded');
  return { raw: { navigated: true, hash }, ok: true };
}

async function handleExtWaitForScreen(node, ctx) {
  const timeout = node.timeout_ms || 10000;
  const poll = node.poll_ms || 500;
  const deadline = Date.now() + timeout;
  const target = node.screen || '';

  while (Date.now() < deadline) {
    const resp = await ctx.callHandler('mm_get_state', {});
    if (resp.ok) {
      const state = resp.result?.state;
      const currentScreen = String(state?.currentScreen || '');
      if (currentScreen.toLowerCase().includes(target.toLowerCase())) {
        return { raw: { screen: currentScreen }, ok: true };
      }
    }
    await delay(poll);
  }

  return { raw: { timeout: true }, ok: false, error: `Timed out waiting for screen "${target}"` };
}

async function handleExtCheckDom(node, ctx) {
  const page = ctx.getPage();
  const locatorStr = node.test_id
    ? `[data-testid="${node.test_id}"]`
    : (node.selector || '');

  if (!locatorStr) {
    return { raw: null, ok: false, error: 'ext_check_dom requires test_id or selector' };
  }

  const locator = page.locator(locatorStr).first();

  try {
    const result = {};
    const isVisible = await locator.isVisible();
    result.visible = isVisible;

    if (node.visible !== undefined && !node.query) {
      if (isVisible !== node.visible) {
        return { raw: result, ok: false, error: `Expected visible=${node.visible}, got ${isVisible}` };
      }
    }

    if (node.text !== undefined) {
      result.text = await locator.textContent({ timeout: 5000 });
    }

    if (node.attribute) {
      result[node.attribute] = await locator.getAttribute(node.attribute, { timeout: 5000 });
    }

    return { raw: result, ok: true };
  } catch (err) {
    // In query mode, return ok:true with visible:false so save_as works
    if (node.query) return { raw: { visible: false }, ok: true };
    return { raw: null, ok: false, error: `ext_check_dom failed: ${err.message || err}` };
  }
}

module.exports = {
  delay,
  evalAsync,
  evalSync,
  execEvalRef,
  executeNodeAction,
  fromResponse,
  getExtensionPage,
  loadEvalRefs,
  routeToHash,
  ROUTE_MAP,
  waitForAdvance,
};
