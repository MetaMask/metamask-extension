/**
 * validate-recipe.ts — Main recipe runner for MetaMask Extension.
 *
 * CLI: npx tsx validate-recipe.ts --recipe <path> [--dry-run] [--step <id>] [--skip-manual] [--param key=val]
 *
 * Executes JSON recipe files deterministically with zero LLM calls.
 * Supports batch optimization, flow_ref composition, and assertion evaluation.
 */

/* eslint-disable import-x/extensions */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { handleRunSteps } from '@metamask/client-mcp-core';
/* eslint-enable import-x/extensions */
import type {
  McpResponse,
  RunStepsResult,
  ISessionManager,
} from '@metamask/client-mcp-core';

import { checkAssert } from './lib/assert';
import { substituteTemplates, type InputDef } from './lib/template';
import { bootstrapSession, bootstrapCdpSession } from './lib/session-bootstrap';
import { loadEvalRefs, getServiceWorkerPage, evalAsync } from './lib/eval-engine';
import {
  runPreConditions,
  type PreConditionContext,
  type PreConditionRegistry,
  type PreConditionSpec,
} from './lib/pre-condition-runner';
import {
  executeAction,
  isBatchable,
  stepToRunStepsEntry,
  type Step,
  type RunContext,
} from './lib/action-mapper';

// ── Types ───────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/naming-convention */
type Recipe = {
  title: string;
  pr?: string | number;
  inputs?: Record<string, InputDef>;
  initial_conditions?: Record<string, unknown>;
  validate: {
    runtime: {
      pre_conditions?: PreConditionSpec[];
      steps: Step[];
    };
  };
};
/* eslint-enable @typescript-eslint/naming-convention */

type CliArgs = {
  recipe: string;
  dryRun: boolean;
  step: string | null;
  skipManual: boolean;
  cdpPort: number | null;
  params: Record<string, string>;
};

// ── CLI arg parsing ─────────────────────────────────────────────────

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    recipe: '',
    dryRun: false,
    step: null,
    skipManual: false,
    cdpPort: null,
    params: {},
  };

  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case '--recipe':
        i += 1;
        result.recipe = args[i] ?? '';
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--step':
        i += 1;
        result.step = args[i] ?? null;
        break;
      case '--skip-manual':
        result.skipManual = true;
        break;
      case '--cdp-port': {
        i += 1;
        const port = parseInt(args[i] ?? '', 10);
        if (!Number.isNaN(port)) {
          result.cdpPort = port;
        }
        break;
      }
      case '--param': {
        i += 1;
        const kv = args[i] ?? '';
        const eqIdx = kv.indexOf('=');
        if (eqIdx > 0) {
          result.params[kv.slice(0, eqIdx)] = kv.slice(eqIdx + 1);
        }
        break;
      }
      default:
        // Positional: treat as recipe path if --recipe not given
        if (!result.recipe && !args[i].startsWith('--')) {
          result.recipe = args[i];
        }
    }
  }

  return result;
}

// ── Recipe loading + validation ─────────────────────────────────────

function loadRecipe(path: string): Recipe {
  if (!existsSync(path)) {
    throw new Error(`Recipe file not found: ${path}`);
  }

  const raw = JSON.parse(readFileSync(path, 'utf-8'));

  if (!raw.title || typeof raw.title !== 'string') {
    throw new Error('Recipe must have a "title" string');
  }
  if (
    !raw.validate?.runtime?.steps ||
    !Array.isArray(raw.validate.runtime.steps)
  ) {
    throw new Error('Recipe must have "validate.runtime.steps" array');
  }
  if (raw.validate.runtime.steps.length === 0) {
    throw new Error('Recipe must have at least one step');
  }

  for (const step of raw.validate.runtime.steps) {
    if (!step.id || !step.action) {
      throw new Error(
        `Each step must have "id" and "action". Found: ${JSON.stringify(step)}`,
      );
    }
  }

  return raw as Recipe;
}

// ── Batch grouping ──────────────────────────────────────────────────

type BatchGroup =
  | { type: 'batch'; steps: Step[] }
  | { type: 'single'; step: Step };

function groupIntoBatches(steps: Step[]): BatchGroup[] {
  const groups: BatchGroup[] = [];
  let batch: Step[] = [];

  for (const step of steps) {
    if (isBatchable(step) && stepToRunStepsEntry(step) !== null) {
      batch.push(step);
    } else {
      if (batch.length > 0) {
        groups.push({ type: 'batch', steps: [...batch] });
        batch = [];
      }
      groups.push({ type: 'single', step });
    }
  }

  if (batch.length > 0) {
    groups.push({ type: 'batch', steps: batch });
  }

  return groups;
}

// ── Pre-condition registry loading ──────────────────────────────────

function loadPreConditionRegistries(
  recipesDir: string,
  teamDir: string,
): PreConditionRegistry[] {
  const registries: PreConditionRegistry[] = [];

  // Load extension-core pre-conditions (always available)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/no-dynamic-require
    const coreModule = require(
      join(recipesDir, 'teams', 'extension-core', 'pre-conditions'),
    );
    if (coreModule.REGISTRY) {
      registries.push(coreModule.REGISTRY);
    }
  } catch {
    // Core pre-conditions not available
  }

  // Load team-specific pre-conditions
  if (teamDir !== join(recipesDir, 'teams', 'extension-core')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/no-dynamic-require
      const teamModule = require(join(teamDir, 'pre-conditions'));
      if (teamModule.REGISTRY) {
        registries.push(teamModule.REGISTRY);
      }
    } catch {
      // Team pre-conditions not available
    }
  }

  return registries;
}

// ── Reporting ───────────────────────────────────────────────────────

function printStepResult(
  stepId: string,
  passed: boolean,
  durationMs: number,
  error?: string,
): void {
  const icon = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  const time = `${durationMs}ms`;
  process.stdout.write(`  [${icon}] ${stepId} (${time})\n`);
  if (error) {
    process.stdout.write(`         ${error}\n`);
  }
}

function printSummary(passed: number, failed: number, totalMs: number): void {
  const total = passed + failed;
  const color = failed > 0 ? '\x1b[31m' : '\x1b[32m';
  process.stdout.write(
    `\n${color}${passed}/${total} passed\x1b[0m in ${totalMs}ms\n`,
  );
}

// ── Initial conditions ──────────────────────────────────────────────

async function applyInitialConditions(
  conditions: Record<string, unknown> | undefined,
  ctx: RunContext,
): Promise<void> {
  if (!conditions) {
    return;
  }
  process.stdout.write('\nInitial conditions:\n');

  if (conditions.account) {
    await executeAction(
      { id: 'ic-account', action: 'select_account', address: String(conditions.account) },
      ctx,
    );
    process.stdout.write(`  [OK] account → ${String(conditions.account)}\n`);
  }

  if (conditions.testnet !== undefined) {
    const swPage = await getServiceWorkerPage(ctx.getContext(), ctx.extensionId);
    const current = await evalAsync(
      swPage,
      "(async()=>{const s=await chrome.storage.local.get('data');return s?.data?.PerpsController?.isTestnet??false})()",
    );
    if (Boolean(current) !== Boolean(conditions.testnet)) {
      await executeAction({ id: 'ic-testnet', action: 'toggle_testnet' }, ctx);
    }
    process.stdout.write(`  [OK] testnet → ${String(conditions.testnet)}\n`);
  }

  if (conditions.provider) {
    await executeAction(
      { id: 'ic-provider', action: 'switch_provider', provider: String(conditions.provider) },
      ctx,
    );
    process.stdout.write(`  [OK] provider → ${String(conditions.provider)}\n`);
  }
}

// ── Main execution ──────────────────────────────────────────────────

async function main(): Promise<void> {
  const cli = parseArgs();

  if (!cli.recipe) {
    process.stderr.write(
      'Usage: validate-recipe.ts --recipe <path> [--dry-run] [--step <id>] [--skip-manual] [--cdp-port <port>] [--param key=val]\n',
    );
    process.exit(1);
  }

  // Resolve paths
  const recipePath = resolve(cli.recipe);
  // Determine team dir and recipes root from path (teams/<team>/flows/<recipe>.json)
  const pathParts = recipePath.split('/');
  const flowsIdx = pathParts.lastIndexOf('flows');
  const teamsIdx = pathParts.lastIndexOf('teams');
  const teamDir =
    flowsIdx > 0 ? pathParts.slice(0, flowsIdx).join('/') : dirname(recipePath);
  // recipesDir is the directory containing 'teams/' (one level above 'teams/')
  const recipesDir =
    teamsIdx > 0
      ? pathParts.slice(0, teamsIdx).join('/')
      : resolve(dirname(recipePath), '../..');

  // Load and validate recipe
  const rawRecipe = loadRecipe(recipePath);
  process.stdout.write(`\nRecipe: ${rawRecipe.title}\n`);

  // Template substitution
  const inputs = rawRecipe.inputs ?? {};
  const recipe = substituteTemplates(rawRecipe, cli.params, inputs) as Recipe;

  process.stdout.write(`Title: ${recipe.title}\n`);
  process.stdout.write(`Steps: ${recipe.validate.runtime.steps.length}\n`);

  // Filter to single step if --step provided
  let { steps } = recipe.validate.runtime;
  if (cli.step) {
    steps = steps.filter((s) => s.id === cli.step);
    if (steps.length === 0) {
      process.stderr.write(`Step "${cli.step}" not found in recipe\n`);
      process.exit(1);
    }
  }

  // Dry run: print execution plan and exit
  if (cli.dryRun) {
    process.stdout.write('\n--- DRY RUN ---\n');
    const groups = groupIntoBatches(steps);
    for (const group of groups) {
      if (group.type === 'batch') {
        process.stdout.write(
          `  [BATCH] ${group.steps.length} steps: ${group.steps.map((s) => s.id).join(', ')}\n`,
        );
      } else {
        process.stdout.write(
          `  [STEP]  ${group.step.id} (${group.step.action})\n`,
        );
      }
    }
    process.stdout.write('\nDry run complete. No browser actions taken.\n');
    process.exit(0);
  }

  // Bootstrap session — CDP mode skips mm_launch entirely
  let weLaunched = false;
  let callHandler: (
    toolName: string,
    input: Record<string, unknown>,
  ) => Promise<McpResponse<unknown>>;
  let sessionManager: ISessionManager;

  if (cli.cdpPort !== null) {
    process.stdout.write(
      `\nConnecting to existing browser via CDP on port ${cli.cdpPort}...\n`,
    );
    const cdpResult = await bootstrapCdpSession(cli.cdpPort);
    callHandler = cdpResult.callHandler;
    sessionManager = cdpResult.sessionManager;
  } else {
    const result = bootstrapSession();
    callHandler = result.callHandler;
    sessionManager = result.sessionManager;

    if (!sessionManager.hasActiveSession()) {
      process.stdout.write('\nLaunching browser session...\n');
      await callHandler('mm_launch', {});
      weLaunched = true;
    }
  }

  // Load eval refs (merge core + team-specific)
  const coreEvalsDir = join(recipesDir, 'teams', 'extension-core');
  const evalRegistry = {
    ...loadEvalRefs(coreEvalsDir),
    ...loadEvalRefs(teamDir),
  };

  // Get extension ID from session state
  const sessionState = sessionManager.getSessionState();
  const extensionId = sessionState?.extensionId ?? '';

  // Build run context
  const ctx: RunContext = {
    callHandler,
    extensionId,
    recipesDir,
    teamDir,
    evalRegistry,
    params: cli.params,
    inputs,
    skipManual: cli.skipManual,
    flowStack: new Set<string>(),
    getPage: () => sessionManager.getPage(),
    getContext: () => sessionManager.getContext(),
  };

  // Evaluate pre-conditions
  const preConditions = recipe.validate.runtime.pre_conditions;
  if (preConditions && preConditions.length > 0) {
    process.stdout.write('\nPre-conditions:\n');
    const registries = loadPreConditionRegistries(recipesDir, teamDir);
    const preContext: PreConditionContext = {
      getPage: () => sessionManager.getPage(),
      getContext: () => sessionManager.getContext(),
      extensionId,
    };
    const preResult = await runPreConditions(
      preConditions,
      registries,
      callHandler,
      preContext,
    );

    for (const r of preResult.results) {
      const icon = r.pass ? '\x1b[32mOK\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      process.stdout.write(`  [${icon}] ${r.name} (${r.durationMs}ms)\n`);
      if (!r.pass) {
        process.stdout.write(`         Hint: ${r.hint}\n`);
      }
    }

    if (!preResult.allPassed) {
      process.stdout.write('\nPre-conditions failed. Aborting.\n');
      if (weLaunched) {
        await callHandler('mm_cleanup', {});
      }
      process.exit(1);
    }
  }

  // Apply initial conditions (account, testnet, provider)
  await applyInitialConditions(recipe.initial_conditions, ctx);

  // Execute steps
  process.stdout.write('\nSteps:\n');
  const totalStart = Date.now();
  let passed = 0;
  let failed = 0;

  const groups = groupIntoBatches(steps);

  for (const group of groups) {
    if (group.type === 'batch' && group.steps.length > 1) {
      // Execute as mm_run_steps batch
      const batchEntries = group.steps
        .map((s) => stepToRunStepsEntry(s))
        .filter((e): e is NonNullable<typeof e> => e !== null);

      const batchStart = Date.now();
      const batchResp: McpResponse<RunStepsResult> = await handleRunSteps({
        steps: batchEntries,
        stopOnError: true,
      });
      const batchDuration = Date.now() - batchStart;

      if (batchResp.ok) {
        const { summary } = batchResp.result;
        for (let i = 0; i < group.steps.length; i += 1) {
          const stepResult = batchResp.result.steps[i];
          if (stepResult?.ok) {
            passed += 1;
            printStepResult(
              group.steps[i].id,
              true,
              stepResult.meta.durationMs,
            );
          } else {
            failed += 1;
            printStepResult(
              group.steps[i].id,
              false,
              stepResult?.meta.durationMs ?? 0,
              stepResult?.error?.message,
            );
          }
        }
        // If batch stopped early due to error, mark remaining as failed
        if (!summary.ok) {
          for (
            let i = batchResp.result.steps.length;
            i < group.steps.length;
            i += 1
          ) {
            failed += 1;
            printStepResult(
              group.steps[i].id,
              false,
              0,
              'Skipped (previous step failed)',
            );
          }
        }
      } else {
        // Entire batch failed
        for (const s of group.steps) {
          failed += 1;
          printStepResult(s.id, false, batchDuration, batchResp.error.message);
        }
      }
    } else {
      // Single step execution (or batch of 1)
      const step = group.type === 'single' ? group.step : group.steps[0];
      const stepStart = Date.now();

      const result = await executeAction(step, ctx);
      const stepDuration = Date.now() - stepStart;

      let stepPassed = result.ok;

      // Evaluate assertion if present
      if (step.assert && result.ok) {
        const assertPassed = checkAssert(result.raw, step.assert);
        if (!assertPassed) {
          stepPassed = false;
          result.error = `Assertion failed: ${JSON.stringify(step.assert)} on ${JSON.stringify(result.raw)}`;
        }
      }

      if (stepPassed) {
        passed += 1;
      } else {
        failed += 1;
      }
      printStepResult(
        step.id,
        stepPassed,
        stepDuration,
        stepPassed ? undefined : result.error,
      );
    }
  }

  const totalDuration = Date.now() - totalStart;
  printSummary(passed, failed, totalDuration);

  // Cleanup: call mm_cleanup if we launched; in CDP mode just disconnect
  if (weLaunched) {
    await callHandler('mm_cleanup', {});
  } else if (cli.cdpPort !== null) {
    await sessionManager.cleanup();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  process.stderr.write(
    `Fatal error: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
