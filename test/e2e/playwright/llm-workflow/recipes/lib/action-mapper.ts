/**
 * Action mapper — translates recipe actions to MCP tool handler calls.
 * Core of the recipe system: each mobile action maps to one or more tool invocations.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import type { BrowserContext, Page } from '@playwright/test';
import type { McpResponse } from '@metamask/client-mcp-core';
import { checkAssert, type AssertSpec } from './assert';
import { routeToHash } from './route-map';
import { substituteTemplates, type InputDef } from './template';
import {
  getServiceWorkerPage,
  evalSync,
  evalAsync,
  execEvalRef,
  type EvalRef,
} from './eval-engine';

/* eslint-disable @typescript-eslint/naming-convention */
export type Step = {
  id: string;
  action: string;
  test_id?: string;
  value?: string;
  target?: string;
  params?: Record<string, string>;
  ref?: string;
  ms?: number;
  timeout_ms?: number;
  poll_ms?: number;
  expression?: string;
  filename?: string;
  note?: string;
  route?: string;
  not_route?: string;
  visible?: boolean;
  hash?: string;
  screen?: string;
  role?: string;
  selector?: string;
  attribute?: string;
  text?: string;
  offset?: number;
  must_not_appear?: string[];
  watch_for?: string[];
  window_seconds?: number;
  enabled?: boolean;
  provider?: string;
  address?: string;
  assert?: AssertSpec;
};
/* eslint-enable @typescript-eslint/naming-convention */

export type ActionResult = {
  raw: unknown;
  ok: boolean;
  error?: string;
};

export type CallHandlerFn = (
  toolName: string,
  input: Record<string, unknown>,
) => Promise<McpResponse<unknown>>;

export type RunContext = {
  callHandler: CallHandlerFn;
  extensionId: string;
  recipesDir: string;
  teamDir: string;
  evalRegistry: Record<string, EvalRef>;
  params: Record<string, string>;
  inputs: Record<string, InputDef>;
  skipManual: boolean;
  flowStack: Set<string>;
  getPage: () => Page;
  getContext: () => BrowserContext;
};

/**
 * Unwrap an McpResponse into an ActionResult.
 * @param resp
 */
function fromResponse(resp: McpResponse<unknown>): ActionResult {
  if (resp.ok) {
    return { raw: resp.result, ok: true };
  }
  return { raw: null, ok: false, error: resp.error.message };
}

/**
 * Execute a single recipe step by mapping its action to tool handler call(s).
 * @param step
 * @param ctx
 */
export async function executeAction(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  switch (step.action) {
    case 'press':
      return fromResponse(
        await ctx.callHandler('mm_click', { testId: step.test_id }),
      );

    case 'set_input':
      return handleSetInput(step, ctx);

    case 'type_keypad':
      // Extension has HTML inputs — same as set_input
      return fromResponse(
        await ctx.callHandler('mm_type', {
          testId: step.test_id,
          text: step.value ?? '',
        }),
      );

    case 'clear_keypad':
      return fromResponse(
        await ctx.callHandler('mm_type', {
          testId: step.test_id,
          text: '',
        }),
      );

    case 'navigate':
      return handleNavigate(step, ctx);

    case 'wait':
      await delay(step.ms ?? 1000);
      return { raw: null, ok: true };

    case 'wait_for':
      return handleWaitFor(step, ctx);

    case 'screenshot':
      return fromResponse(
        await ctx.callHandler('mm_screenshot', {
          name: step.filename ?? step.id,
        }),
      );

    case 'eval_sync':
      return handleEvalSync(step, ctx);

    case 'eval_async':
      return handleEvalAsync(step, ctx);

    case 'eval_ref':
      return handleEvalRef(step, ctx);

    case 'flow_ref':
      return handleFlowRef(step, ctx);

    case 'log_watch':
      return handleLogWatch(step, ctx);

    case 'scroll':
      return handleScroll(step, ctx);

    case 'manual':
      return handleManual(step, ctx);

    case 'select_account':
      return handleSelectAccount(step, ctx);

    case 'toggle_testnet':
      return handleToggleTestnet(step, ctx);

    case 'switch_provider':
      return handleSwitchProvider(step, ctx);

    case 'ext_navigate_hash':
      return handleExtNavigateHash(step, ctx);

    case 'ext_wait_for_screen':
      return handleExtWaitForScreen(step, ctx);

    case 'ext_switch_tab':
      return fromResponse(
        await ctx.callHandler('mm_switch_to_tab', {
          role: step.role,
        }),
      );

    case 'ext_check_dom':
      return handleExtCheckDom(step, ctx);

    default:
      return { raw: null, ok: false, error: `Unknown action: ${step.action}` };
  }
}

// ── Action implementations ──────────────────────────────────────────

async function handleNavigate(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const target = step.target ?? '';
  let hash = routeToHash(target);

  // Dynamic segment handling for parameterized routes
  if (hash) {
    hash = resolveNavigateParams(target, hash, step);
    const page = ctx.getPage();
    const extUrl = `chrome-extension://${ctx.extensionId}/home.html${hash}`;
    await page.goto(extUrl);
    await page.waitForLoadState('domcontentloaded');
    return { raw: { navigated: true, hash }, ok: true };
  }

  // Fallback: try mm_navigate with screen mapping
  const screenMap: Record<string, string> = {
    Home: 'home',
    Settings: 'settings',
  };
  const screen = screenMap[target];
  if (screen) {
    return fromResponse(await ctx.callHandler('mm_navigate', { screen }));
  }

  // Last resort: treat target as a URL
  return fromResponse(
    await ctx.callHandler('mm_navigate', { screen: 'url', url: target }),
  );
}

async function handleSetInput(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  // Try mm_type first (works when testId is on the input element itself)
  const resp = await ctx.callHandler('mm_type', {
    testId: step.test_id,
    text: step.value ?? '',
  });
  if (resp.ok) {
    return fromResponse(resp);
  }

  // Fallback: testId may be on a wrapper div — target its child input
  try {
    const page = ctx.getPage();
    const input = page
      .locator(`[data-testid="${step.test_id}"] input`)
      .first();
    await input.fill(step.value ?? '', { timeout: 5000 });
    return { raw: { filled: true, fallback: true }, ok: true };
  } catch (err) {
    return {
      raw: null,
      ok: false,
      error: `set_input failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function handleWaitFor(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const timeout = step.timeout_ms ?? 10000;
  const poll = step.poll_ms ?? 500;

  // Sugar: test_id (element visibility)
  if (step.test_id) {
    if (step.visible === false) {
      const page = ctx.getPage();
      await page
        .locator(`[data-testid="${step.test_id}"]`)
        .waitFor({ state: 'hidden', timeout });
      return { raw: { found: true, hidden: true }, ok: true };
    }
    return fromResponse(
      await ctx.callHandler('mm_wait_for', {
        testId: step.test_id,
        timeoutMs: timeout,
      }),
    );
  }

  // Sugar: route / not_route
  if (step.route || step.not_route) {
    const deadline = Date.now() + timeout;
    const page = ctx.getPage();
    while (Date.now() < deadline) {
      const currentHash = new URL(page.url()).hash;
      const currentRoute = currentHash.replace('#/', '') || 'home';
      if (step.route && currentRoute.includes(step.route.toLowerCase())) {
        return { raw: { route: currentRoute }, ok: true };
      }
      if (
        step.not_route &&
        !currentRoute.includes(step.not_route.toLowerCase())
      ) {
        return { raw: { route: currentRoute }, ok: true };
      }
      await delay(poll);
    }
    return {
      raw: { timeout: true },
      ok: false,
      error: `Timed out waiting for ${step.route ? `route "${step.route}"` : `not_route "${step.not_route}"`}`,
    };
  }

  // Custom expression polling
  if (step.expression) {
    const deadline = Date.now() + timeout;
    const swPage = await getServiceWorkerPage(
      ctx.getContext(),
      ctx.extensionId,
    );
    while (Date.now() < deadline) {
      try {
        const result = await evalSync(swPage, step.expression);
        if (step.assert && checkAssert(result, step.assert)) {
          return { raw: result, ok: true };
        }
        if (!step.assert && result) {
          return { raw: result, ok: true };
        }
      } catch {
        // retry on next poll
      }
      await delay(poll);
    }
    return {
      raw: { timeout: true },
      ok: false,
      error: `Timed out polling expression for step "${step.id}"`,
    };
  }

  return {
    raw: null,
    ok: false,
    error: `wait_for step "${step.id}" has no target (test_id, route, not_route, or expression)`,
  };
}

async function handleEvalSync(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  try {
    const swPage = await getServiceWorkerPage(
      ctx.getContext(),
      ctx.extensionId,
    );
    const expression = step.expression ?? '';
    const result = await evalSync(swPage, expression);
    return { raw: result, ok: true };
  } catch (err) {
    return {
      raw: null,
      ok: false,
      error: `eval_sync failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function handleEvalAsync(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  try {
    const swPage = await getServiceWorkerPage(
      ctx.getContext(),
      ctx.extensionId,
    );
    const expression = step.expression ?? '';
    const result = await evalAsync(swPage, expression);
    return { raw: result, ok: true };
  } catch (err) {
    return {
      raw: null,
      ok: false,
      error: `eval_async failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function handleEvalRef(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  try {
    const swPage = await getServiceWorkerPage(
      ctx.getContext(),
      ctx.extensionId,
    );
    const refName = step.ref ?? '';
    const result = await execEvalRef(refName, ctx.evalRegistry, swPage);
    return { raw: result, ok: true };
  } catch (err) {
    return {
      raw: null,
      ok: false,
      error: `eval_ref "${step.ref}" failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function handleFlowRef(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const ref = step.ref ?? '';

  // Circular reference detection
  if (ctx.flowStack.has(ref)) {
    return {
      raw: null,
      ok: false,
      error: `Circular flow_ref detected: "${ref}" is already in the call stack`,
    };
  }

  // Resolve the flow file path
  // ref can be "team/flow-name" or just "flow-name" (relative to current team)
  let flowPath: string;
  if (ref.includes('/')) {
    flowPath = join(
      ctx.recipesDir,
      'teams',
      `${ref.replace('/', '/flows/')}.json`,
    );
  } else {
    flowPath = join(ctx.teamDir, 'flows', `${ref}.json`);
  }

  let flowJson: Record<string, unknown>;
  try {
    flowJson = JSON.parse(readFileSync(flowPath, 'utf-8'));
  } catch (err) {
    return {
      raw: null,
      ok: false,
      error: `Failed to load flow_ref "${ref}" from ${flowPath}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Apply template substitution with the caller's params
  const flowInputs = (flowJson.inputs ?? {}) as Record<string, InputDef>;
  const callerParams = step.params ?? {};
  const substituted = substituteTemplates(
    flowJson,
    callerParams,
    flowInputs,
  ) as Record<string, unknown>;

  // Extract steps
  const validate = substituted.validate as Record<string, unknown> | undefined;
  const runtime = validate?.runtime as Record<string, unknown> | undefined;
  const steps = runtime?.steps as Step[] | undefined;
  if (!steps || steps.length === 0) {
    return { raw: null, ok: false, error: `flow_ref "${ref}" has no steps` };
  }

  // Determine the team dir for the referenced flow
  const refTeamDir = dirname(dirname(flowPath));

  // Execute sub-flow steps
  const subCtx: RunContext = {
    ...ctx,
    teamDir: refTeamDir,
    flowStack: new Set([...ctx.flowStack, ref]),
  };

  for (const subStep of steps) {
    const result = await executeAction(subStep, subCtx);

    // Check assertion if present
    if (subStep.assert) {
      const assertPassed = checkAssert(result.raw, subStep.assert);
      if (!assertPassed) {
        return {
          raw: result.raw,
          ok: false,
          error: `flow_ref "${ref}" failed at step "${subStep.id}": assertion failed`,
        };
      }
    }

    if (!result.ok) {
      return {
        raw: result.raw,
        ok: false,
        error: `flow_ref "${ref}" failed at step "${subStep.id}": ${result.error}`,
      };
    }
  }

  return { raw: { flowRef: ref, stepsExecuted: steps.length }, ok: true };
}

async function handleLogWatch(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const page = ctx.getPage();
  const windowMs = (step.window_seconds ?? 5) * 1000;
  const logs: string[] = [];
  const violations: string[] = [];

  const handler = (msg: { text: () => string }) => {
    logs.push(msg.text());
  };
  page.on('console', handler);

  await delay(windowMs);
  page.off('console', handler);

  // Check must_not_appear
  if (step.must_not_appear) {
    for (const pattern of step.must_not_appear) {
      for (const log of logs) {
        if (log.includes(pattern)) {
          violations.push(`Found forbidden pattern "${pattern}" in: ${log}`);
        }
      }
    }
  }

  // Check watch_for
  const watched: string[] = [];
  if (step.watch_for) {
    for (const pattern of step.watch_for) {
      const found = logs.some((log) => log.includes(pattern));
      if (found) {
        watched.push(pattern);
      }
    }
  }

  return {
    raw: { logs: logs.length, violations, watched },
    ok: violations.length === 0,
    error: violations.length > 0 ? violations.join('; ') : undefined,
  };
}

async function handleScroll(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const page = ctx.getPage();
  if (step.test_id) {
    await page
      .locator(`[data-testid="${step.test_id}"]`)
      .scrollIntoViewIfNeeded();
  } else {
    await page.mouse.wheel(0, step.offset ?? 300);
  }
  return { raw: null, ok: true };
}

async function handleManual(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  if (ctx.skipManual) {
    process.stdout.write(
      `  [SKIP] Manual step "${step.id}": ${step.note ?? 'no note'}\n`,
    );
    return { raw: { skipped: true }, ok: true };
  }

  process.stdout.write(`\n  ⏸  MANUAL: ${step.note ?? step.id}\n`);
  process.stdout.write('     Press Enter to continue...');

  await new Promise<void>((resolve) => {
    const onData = () => {
      process.stdin.off('data', onData);
      resolve();
    };
    process.stdin.on('data', onData);
  });

  return { raw: { manual: true }, ok: true };
}

async function handleSelectAccount(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  // Open account menu
  let resp = await ctx.callHandler('mm_click', {
    testId: 'account-menu-icon',
  });
  if (!resp.ok) {
    return fromResponse(resp);
  }

  await delay(500);

  // Look for the account by address (click text matching the address)
  if (step.address) {
    resp = await ctx.callHandler('mm_click', {
      selector: `[data-testid="account-menu-icon"]`,
    });
    // Try clicking by partial address text
    const page = ctx.getPage();
    const short = `${step.address.slice(0, 6)}...${step.address.slice(-4)}`;
    try {
      await page.locator(`text=${short}`).first().click({ timeout: 5000 });
    } catch {
      return {
        raw: null,
        ok: false,
        error: `Could not find account with address ${step.address}`,
      };
    }
  }

  return { raw: { selected: step.address }, ok: true };
}

async function handleToggleTestnet(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  // Navigate to advanced settings
  const page = ctx.getPage();
  const extUrl = `chrome-extension://${ctx.extensionId}/home.html#/settings/advanced`;
  await page.goto(extUrl);
  await page.waitForLoadState('domcontentloaded');
  await delay(1000);

  // Find and click the testnet toggle
  try {
    const toggle = page.locator(
      '[data-testid="advanced-setting-show-testnet-conversion"] input[type="checkbox"]',
    );
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click({ timeout: 5000 });
    return { raw: { toggled: true }, ok: true };
  } catch {
    return {
      raw: null,
      ok: false,
      error: 'Could not find testnet toggle in advanced settings',
    };
  }
}

async function handleSwitchProvider(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const page = ctx.getPage();
  const extUrl = `chrome-extension://${ctx.extensionId}/home.html#/settings/networks`;
  await page.goto(extUrl);
  await page.waitForLoadState('domcontentloaded');
  await delay(1000);

  if (step.provider) {
    try {
      await page
        .locator(`text=${step.provider}`)
        .first()
        .click({ timeout: 5000 });
      return { raw: { switched: step.provider }, ok: true };
    } catch {
      return {
        raw: null,
        ok: false,
        error: `Could not find provider "${step.provider}" in network settings`,
      };
    }
  }

  return { raw: null, ok: false, error: 'No provider specified' };
}

async function handleExtNavigateHash(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const page = ctx.getPage();
  const hash = step.hash ?? '';
  const extUrl = `chrome-extension://${ctx.extensionId}/home.html#/${hash.replace(/^\//u, '')}`;
  await page.goto(extUrl);
  await page.waitForLoadState('domcontentloaded');
  return { raw: { navigated: true, hash }, ok: true };
}

async function handleExtWaitForScreen(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const timeout = step.timeout_ms ?? 10000;
  const poll = step.poll_ms ?? 500;
  const deadline = Date.now() + timeout;
  const target = step.screen ?? '';

  while (Date.now() < deadline) {
    const resp = await ctx.callHandler('mm_get_state', {});
    if (resp.ok) {
      const state = (resp.result as Record<string, unknown>).state as
        | Record<string, unknown>
        | undefined;
      const currentScreen = String(state?.currentScreen ?? '');
      if (currentScreen.toLowerCase().includes(target.toLowerCase())) {
        return { raw: { screen: currentScreen }, ok: true };
      }
    }
    await delay(poll);
  }

  return {
    raw: { timeout: true },
    ok: false,
    error: `Timed out waiting for screen "${target}"`,
  };
}

async function handleExtCheckDom(
  step: Step,
  ctx: RunContext,
): Promise<ActionResult> {
  const page = ctx.getPage();
  const locatorStr = step.test_id
    ? `[data-testid="${step.test_id}"]`
    : (step.selector ?? '');

  if (!locatorStr) {
    return {
      raw: null,
      ok: false,
      error: 'ext_check_dom requires test_id or selector',
    };
  }

  const locator = page.locator(locatorStr).first();

  try {
    const result: Record<string, unknown> = {};

    if (step.visible !== undefined) {
      const isVisible = await locator.isVisible();
      result.visible = isVisible;
      if (isVisible !== step.visible) {
        return {
          raw: result,
          ok: false,
          error: `Expected visible=${step.visible}, got ${isVisible}`,
        };
      }
    }

    if (step.text !== undefined) {
      const textContent = await locator.textContent({ timeout: 5000 });
      result.text = textContent;
    }

    if (step.attribute) {
      const attrValue = await locator.getAttribute(step.attribute, {
        timeout: 5000,
      });
      result[step.attribute] = attrValue;
    }

    return { raw: result, ok: true };
  } catch (err) {
    return {
      raw: null,
      ok: false,
      error: `ext_check_dom failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Navigate param resolution ────────────────────────────────────────

/**
 * Append dynamic segments to route hashes based on step params.
 * e.g. PerpsMarketDetails + { market: { symbol: "ETH" } } → #/perps/market/ETH
 */
function resolveNavigateParams(
  target: string,
  hash: string,
  step: Step,
): string {
  if (target === 'PerpsMarketDetails' && step.params?.market) {
    const market = step.params.market as unknown as Record<string, string>;
    return `#/perps/market/${market.symbol ?? ''}`;
  }
  if (target === 'PerpsOrderEntry' && step.params) {
    const market = step.params.market as unknown as Record<string, string>;
    const symbol = market?.symbol ?? '';
    const direction = step.params.direction ?? 'long';
    return `#/perps/trade/${symbol}?direction=${direction}&mode=new`;
  }
  return hash;
}

// ── Batch support ───────────────────────────────────────────────────

/** Actions that cannot be batched (require special handling or assertions) */
const UNBATCHABLE_ACTIONS = new Set([
  'flow_ref',
  'manual',
  'set_input',
  'wait_for',
  'eval_sync',
  'eval_async',
  'eval_ref',
  'log_watch',
  'ext_wait_for_screen',
  'ext_check_dom',
]);

/**
 * Check if a step can be included in a batch (mm_run_steps).
 * @param step
 */
export function isBatchable(step: Step): boolean {
  if (step.assert) {
    return false;
  }
  if (UNBATCHABLE_ACTIONS.has(step.action)) {
    return false;
  }
  return true;
}

/**
 * Map a simple step to an mm_run_steps entry: { tool, args }.
 * @param step
 */
export function stepToRunStepsEntry(
  step: Step,
): { tool: string; args: Record<string, unknown> } | null {
  switch (step.action) {
    case 'press':
      return { tool: 'mm_click', args: { testId: step.test_id } };
    case 'set_input':
    case 'type_keypad':
      return {
        tool: 'mm_type',
        args: { testId: step.test_id, text: step.value ?? '' },
      };
    case 'clear_keypad':
      return { tool: 'mm_type', args: { testId: step.test_id, text: '' } };
    case 'screenshot':
      return {
        tool: 'mm_screenshot',
        args: { name: step.filename ?? step.id },
      };
    case 'wait':
      // wait cannot be batched via mm_run_steps — handled separately
      return null;
    case 'ext_switch_tab':
      return { tool: 'mm_switch_to_tab', args: { role: step.role } };
    case 'navigate': {
      const navHash = routeToHash(step.target ?? '');
      if (!navHash) {
        return null;
      }
      const resolved = resolveNavigateParams(step.target ?? '', navHash, step);
      return { tool: 'mm_navigate', args: { screen: 'url', url: resolved } };
    }
    case 'scroll':
      return null; // Cannot express as single tool call
    default:
      return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
