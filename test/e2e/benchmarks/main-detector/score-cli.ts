/**
 * Usage: yarn tsx test/e2e/benchmarks/main-detector/score-cli.ts --stage first|final --dir ARTIFACTS --plan plan.json --out result.json [--summary FILE] [--github-output FILE] [--shards 5]
 * Reads the artifacts of batch 1 (and 2) from detector-b<batch>-<browser>-s<shard> folders and scores them.
 */
import fs from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { renderSummary, resultLabel, type PlanInfo } from './report';
import {
  DEFAULT_CONFIG,
  decide,
  needsConfirmation,
  scoreBatch,
  type BatchScores,
  type Browser,
  type JobResult,
} from './score';

const BROWSERS = ['chrome', 'firefox'] as const;

function readJob(directory: string): JobResult {
  const unusable: JobResult = { sessions: [], samples: {} };
  if (!fs.existsSync(directory)) {
    return unusable;
  }
  const file = fs
    .readdirSync(directory)
    .find((name) => /^benchmark-.*\.json$/u.test(name));
  if (!file) {
    return unusable;
  }
  const parsed = JSON.parse(
    fs.readFileSync(path.join(directory, file), 'utf8'),
  );
  const entry = Object.values(parsed)[0] as {
    abPilot?: { sessions: JobResult['sessions'] };
    samples?: JobResult['samples'];
  };
  return entry?.abPilot && entry.samples
    ? { sessions: entry.abPilot.sessions, samples: entry.samples }
    : unusable;
}

function loadBatch(
  root: string,
  batch: number,
  shards: number,
  optional = false,
): BatchScores | undefined {
  const folders = fs.existsSync(root) ? fs.readdirSync(root) : [];
  // A missing optional batch was not run; a missing required one scores as unusable jobs.
  if (
    optional &&
    !folders.some((name) => name.startsWith(`detector-b${batch}-`))
  ) {
    return undefined;
  }
  const scores = {} as BatchScores;
  for (const browser of BROWSERS) {
    const jobs = Array.from({ length: shards }, (_, shard) =>
      readJob(path.join(root, `detector-b${batch}-${browser}-s${shard + 1}`)),
    );
    scores[browser] = scoreBatch(browser as Browser, jobs, DEFAULT_CONFIG);
  }
  return scores;
}

function setOutputs(file: string | undefined, values: Record<string, string>) {
  if (file) {
    const text = Object.entries(values)
      .map(([name, value]) => `${name}=${value}\n`)
      .join('');
    fs.appendFileSync(file, text);
  }
}

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('stage', {
      choices: ['first', 'final'] as const,
      demandOption: true,
    })
    .option('dir', { type: 'string', demandOption: true })
    .option('plan', { type: 'string', demandOption: true })
    .option('out', { type: 'string', demandOption: true })
    .option('summary', { type: 'string' })
    .option('github-output', { type: 'string' })
    .option('shards', { type: 'number', default: 5 })
    .parseAsync();

  const plan: PlanInfo = JSON.parse(fs.readFileSync(argv.plan, 'utf8'));
  const first = loadBatch(argv.dir, 1, argv.shards) as BatchScores;

  if (argv.stage === 'first') {
    const confirm = needsConfirmation(first);
    fs.writeFileSync(argv.out, JSON.stringify({ first, confirm }, null, 2));
    // The workflow reads this exact snake_case output name.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    setOutputs(argv.githubOutput, { needs_confirm: String(confirm) });
    console.log(`needs confirmation: ${confirm}`);
    return;
  }

  const second = loadBatch(argv.dir, 2, argv.shards, true);
  const decision = decide(first, second, DEFAULT_CONFIG);
  const label = resultLabel(decision, plan);
  fs.writeFileSync(
    argv.out,
    JSON.stringify({ plan, first, second, decision, label }, null, 2),
  );
  const summary = renderSummary({
    plan,
    first,
    second,
    decision,
    config: DEFAULT_CONFIG,
  });
  if (argv.summary) {
    fs.appendFileSync(argv.summary, `${summary}\n`);
  }
  setOutputs(argv.githubOutput, { ping: decision.ping, result: label });
  console.log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
