import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';
import { loadConfig } from './config/load-config';
import { runBatch } from './runner/batch-runner';
import { createRenameHappyPath } from './scenarios/rename-happy-path';
import type { ScenarioFactory } from './scenarios/types';
import { summaryJsonPath } from './artifacts/paths';

const repoRoot = execSync('git rev-parse --show-toplevel', {
  encoding: 'utf-8',
}).trim();
dotenv.config({ path: path.join(repoRoot, '.agents.env') });

const SCENARIOS: Record<string, ScenarioFactory> = {
  'rename-happy-path': createRenameHappyPath,
  rename_happy_path: createRenameHappyPath,
};

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      scenario: { type: 'string', short: 's' },
      trials: { type: 'string', short: 'n' },
      model: { type: 'string', short: 'm' },
      telemetry: { type: 'boolean' },
      judge: { type: 'boolean' },
      'judge-model': { type: 'string' },
      'max-turns': { type: 'string' },
      'max-wallclock-ms': { type: 'string' },
      'no-cold-start': { type: 'boolean' },
      batch: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  const subcommand = positionals[0];

  if (values.help || !subcommand) {
    printUsage();
    process.exit(subcommand ? 0 : 1);
  }

  if (subcommand === 'run') {
    await runCommand(values);
  } else if (subcommand === 'report') {
    reportCommand(values);
  } else {
    console.error(`Unknown subcommand: ${subcommand}`);
    printUsage();
    process.exit(1);
  }
}

async function runCommand(values: Record<string, unknown>) {
  const config = loadConfig({
    scenario: values.scenario as string | undefined,
    trials: values.trials ? parseInt(values.trials as string, 10) : undefined,
    model: values.model as string | undefined,
    telemetry: values.telemetry as boolean | undefined,
    judge: values.judge as boolean | undefined,
    judgeModel: values['judge-model'] as string | undefined,
    maxTurns: values['max-turns']
      ? parseInt(values['max-turns'] as string, 10)
      : undefined,
    maxWallclockMs: values['max-wallclock-ms']
      ? parseInt(values['max-wallclock-ms'] as string, 10)
      : undefined,
    coldStart: values['no-cold-start'] ? false : undefined,
  });

  const factory = SCENARIOS[config.scenario];
  if (!factory) {
    console.error(
      `Unknown scenario: ${config.scenario}\nAvailable: ${Object.keys(SCENARIOS).join(', ')}`,
    );
    process.exit(1);
  }

  const summary = await runBatch(factory, config);
  process.exit(summary.successRate === 1 ? 0 : 1);
}

function reportCommand(values: Record<string, unknown>) {
  const batchTimestamp = values.batch as string | undefined;
  if (!batchTimestamp) {
    console.error('--batch <timestamp> is required for the report subcommand');
    process.exit(1);
  }

  const config = loadConfig({});
  const jsonPath = summaryJsonPath(config.artifactsDir, batchTimestamp);

  if (!fs.existsSync(jsonPath)) {
    console.error(`Summary not found: ${jsonPath}`);
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(JSON.stringify(summary, null, 2));
}

function printUsage() {
  console.log(`
Usage: tsx test/agents/visual-testing/cli.ts <command> [options]

Commands:
  run       Run eval trials
  report    Show results from a previous batch

Run options:
  -s, --scenario <name>       Scenario name (default: rename-happy-path)
  -n, --trials <count>        Number of trials (default: 3)
  -m, --model <model>         Model to use (default: claude-sonnet-4-20250514)
      --telemetry             Enable Langfuse telemetry
      --judge                 Enable LLM-as-judge scoring
      --judge-model <model>   Model for judge (default: claude-sonnet-4-20250514)
      --max-turns <n>         Max agent turns (default: 50)
      --max-wallclock-ms <n>  Max wall-clock time per trial (default: 300000)
      --no-cold-start         Allow knowledge store reuse between trials

Report options:
      --batch <timestamp>     Batch timestamp to report on

Environment variables:
  EVAL_SCENARIO, EVAL_TRIALS, EVAL_MODEL, EVAL_TELEMETRY,
  EVAL_JUDGE, EVAL_JUDGE_MODEL, EVAL_MAX_TURNS,
  EVAL_MAX_WALLCLOCK_MS, EVAL_COLD_START, EVAL_SERVICE_NAME
`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
