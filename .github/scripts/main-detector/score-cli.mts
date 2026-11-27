/**
 * Usage: node .github/scripts/main-detector/score-cli.mts --stage first|final --dir ARTIFACTS --plan plan.json --out result.json [--summary FILE] [--github-output FILE] --shards N [--cuf-shards N]
 * Reads the artifacts of batch 1 (and 2) from detector-b<batch>-<browser>-s<shard> folders and scores them.
 * At the final stage, --cuf-shards also scores the critical user flows from detector-cuf-<flow>-s<shard> folders.
 * A plan with cpuThrottleRate is the daily throttled run: its folders start with throttled- and only Chrome is scored.
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { loadCufJobs, scoreCufs } from './cufs.mts';
import { loadBatch } from './load.mts';
import {
  planConfig,
  planPrefix,
  renderSummary,
  resultLabel,
  type PlanInfo,
} from './report.mts';
import { decide, needsConfirmation } from './score.mts';

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
      shards: { type: 'string' },
      'cuf-shards': { type: 'string' },
    },
  });
  const { stage, dir, plan: planFile, out } = values;
  const shards = Number(values.shards);
  if (
    (stage !== 'first' && stage !== 'final') ||
    !dir ||
    !planFile ||
    !out ||
    !Number.isInteger(shards) ||
    shards < 1
  ) {
    throw new Error(
      '--stage first|final, --dir, --plan, --out and --shards are required',
    );
  }

  const plan: PlanInfo = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  const config = planConfig(plan);
  const prefix = planPrefix(plan);
  const first = loadBatch(dir, 1, shards, false, { config, prefix });
  if (!first) {
    throw new Error('The first batch is required');
  }

  if (stage === 'first') {
    const confirm = needsConfirmation(first);
    fs.writeFileSync(out, JSON.stringify({ first, confirm }, null, 2));
    // The workflow reads this exact snake_case output name.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    setOutputs(values['github-output'], { needs_confirm: String(confirm) });
    console.log(`needs confirmation: ${confirm}`);
    return;
  }

  const second = loadBatch(dir, 2, shards, true, { config, prefix });
  const decision = decide(first, second, config);
  const cufShards = Number(values['cuf-shards']);
  if (
    values['cuf-shards'] !== undefined &&
    (!Number.isInteger(cufShards) || cufShards < 1)
  ) {
    throw new Error('--cuf-shards must be a positive integer');
  }
  const cufs =
    values['cuf-shards'] === undefined
      ? undefined
      : scoreCufs(loadCufJobs(dir, cufShards, prefix));
  const label = resultLabel(decision, plan, cufs);
  fs.writeFileSync(
    out,
    JSON.stringify({ plan, first, second, decision, cufs, label }, null, 2),
  );
  const summary = renderSummary({
    plan,
    first,
    second,
    decision,
    config,
    cufs,
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
