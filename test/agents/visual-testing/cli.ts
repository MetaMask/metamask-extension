import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';
import { loadConfig } from './config/load-config';
import { runBatch, runMultiBatch } from './runner/batch-runner';
import { SCENARIOS } from './scenarios/index';
import { summaryJsonPath } from './artifacts/paths';

const repoRoot = execSync('git rev-parse --show-toplevel', {
  encoding: 'utf-8',
}).trim();
dotenv.config({ path: path.join(repoRoot, '.agents.env') });

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      scenario: { type: 'string', short: 's' },
      scenarios: { type: 'string' },
      trials: { type: 'string', short: 'n' },
      model: { type: 'string', short: 'm' },
      telemetry: { type: 'boolean' },
      judge: { type: 'boolean' },
      'judge-model': { type: 'string' },
      'tool-judge': { type: 'boolean' },
      'tool-judge-model': { type: 'string' },
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

function parseScenariosFlag(
  raw: string | undefined,
): string[] | undefined {
  if (!raw) {
    return undefined;
  }
  if (raw === 'all') {
    return Object.keys(SCENARIOS);
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function runCommand(values: Record<string, unknown>) {
  const scenariosList = parseScenariosFlag(
    values.scenarios as string | undefined,
  );

  const config = loadConfig({
    scenario: values.scenario as string | undefined,
    scenarios: scenariosList,
    trials: values.trials ? parseInt(values.trials as string, 10) : undefined,
    model: values.model as string | undefined,
    telemetry: values.telemetry as boolean | undefined,
    judge: values.judge as boolean | undefined,
    judgeModel: values['judge-model'] as string | undefined,
    toolJudge: values['tool-judge'] as boolean | undefined,
    toolJudgeModel: values['tool-judge-model'] as string | undefined,
    maxTurns: values['max-turns']
      ? parseInt(values['max-turns'] as string, 10)
      : undefined,
    maxWallclockMs: values['max-wallclock-ms']
      ? parseInt(values['max-wallclock-ms'] as string, 10)
      : undefined,
    coldStart: values['no-cold-start'] ? false : undefined,
  });

  if (config.scenarios.length > 0) {
    const entries = resolveScenarioEntries(config.scenarios);
    const multiBatchSummary = await runMultiBatch(entries, config);
    process.exit(multiBatchSummary.aggregate.overallSuccessRate === 1 ? 0 : 1);
    return;
  }

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

function resolveScenarioEntries(
  names: string[],
): Array<{ name: string; factory: (typeof SCENARIOS)[string] }> {
  const entries: Array<{
    name: string;
    factory: (typeof SCENARIOS)[string];
  }> = [];

  for (const name of names) {
    const factory = SCENARIOS[name];
    if (!factory) {
      console.error(
        `Unknown scenario: ${name}\nAvailable: ${Object.keys(SCENARIOS).join(', ')}`,
      );
      process.exit(1);
    }
    entries.push({ name, factory });
  }

  return entries;
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
  const scenarioNames = Object.keys(SCENARIOS).join(', ');
  console.log(`
Usage: tsx test/agents/visual-testing/cli.ts <command> [options]

Commands:
  run       Run eval trials
  report    Show results from a previous batch

Run options:
  -s, --scenario <name>       Single scenario name (default: rename-happy-path)
      --scenarios <list>      Comma-separated scenario names, or "all"
  -n, --trials <count>        Number of trials per scenario (default: 3)
  -m, --model <model>         Model to use (default: claude-sonnet-4-6)
      --telemetry             Enable Langfuse telemetry
      --judge                 Enable LLM-as-judge scoring (agent performance)
      --judge-model <model>   Model for agent judge (default: claude-opus-4-7)
      --tool-judge            Enable LLM-as-judge scoring (mm CLI tool effectiveness)
      --tool-judge-model <m>  Model for tool judge (default: claude-sonnet-4-6)
      --max-turns <n>         Max agent turns (default: 50)
      --max-wallclock-ms <n>  Max wall-clock time per trial (default: 300000)
      --no-cold-start         Allow knowledge store reuse between trials

Report options:
      --batch <timestamp>     Batch timestamp to report on

Available scenarios:
  ${scenarioNames}

Examples:
  tsx cli.ts run --scenario rename-happy-path --trials 5
  tsx cli.ts run --scenarios all --trials 3 --judge --tool-judge
  tsx cli.ts run --scenarios rename-happy-path,switch-network --trials 5

Environment variables:
  EVAL_SCENARIO, EVAL_SCENARIOS, EVAL_TRIALS, EVAL_MODEL, EVAL_TELEMETRY,
  EVAL_JUDGE, EVAL_JUDGE_MODEL, EVAL_TOOL_JUDGE, EVAL_TOOL_JUDGE_MODEL,
  EVAL_MAX_TURNS, EVAL_MAX_WALLCLOCK_MS, EVAL_COLD_START, EVAL_SERVICE_NAME
`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
