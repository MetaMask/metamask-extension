/**
 * Usage: node .github/scripts/main-detector/score-cli.mts --stage first|final --dir ARTIFACTS --plan plan.json --out result.json [--summary FILE] [--github-output FILE] [--shards 5]
 * Reads the artifacts of batch 1 (and 2) from detector-b<batch>-<browser>-s<shard> folders and scores them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { renderSummary, resultLabel, type PlanInfo } from './report.mts';
import {
  BROWSERS,
  DEFAULT_CONFIG,
  decide,
  needsConfirmation,
  scoreBatch,
  type BatchScores,
  type JobResult,
} from './score.mts';

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
    scores[browser] = scoreBatch(browser, jobs, DEFAULT_CONFIG);
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
  const { values } = parseArgs({
    options: {
      stage: { type: 'string' },
      dir: { type: 'string' },
      plan: { type: 'string' },
      out: { type: 'string' },
      summary: { type: 'string' },
      'github-output': { type: 'string' },
      shards: { type: 'string', default: '5' },
    },
  });
  const { stage, dir, plan: planFile, out } = values;
  if ((stage !== 'first' && stage !== 'final') || !dir || !planFile || !out) {
    throw new Error(
      '--stage first|final, --dir, --plan and --out are required',
    );
  }
  const shards = Number(values.shards);

  const plan: PlanInfo = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  const first = loadBatch(dir, 1, shards) as BatchScores;

  if (stage === 'first') {
    const confirm = needsConfirmation(first);
    fs.writeFileSync(out, JSON.stringify({ first, confirm }, null, 2));
    // The workflow reads this exact snake_case output name.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    setOutputs(values['github-output'], { needs_confirm: String(confirm) });
    console.log(`needs confirmation: ${confirm}`);
    return;
  }

  const second = loadBatch(dir, 2, shards, true);
  const decision = decide(first, second, DEFAULT_CONFIG);
  const label = resultLabel(decision, plan);
  fs.writeFileSync(
    out,
    JSON.stringify({ plan, first, second, decision, label }, null, 2),
  );
  const summary = renderSummary({
    plan,
    first,
    second,
    decision,
    config: DEFAULT_CONFIG,
  });
  if (values.summary) {
    fs.appendFileSync(values.summary, `${summary}\n`);
  }
  setOutputs(values['github-output'], { ping: decision.ping, result: label });
  console.log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
