/**
 * Usage: node .github/scripts/main-detector/score-cli.mts --stage first|final --dir ARTIFACTS --plan plan.json --out result.json [--summary FILE] [--github-output FILE] --shards N
 * Reads the artifacts of batch 1 (and 2) from detector-b<batch>-<browser>-s<shard> folders and scores them.
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { loadBatch } from './load.mts';
import { renderSummary, resultLabel, type PlanInfo } from './report.mts';
import {
  DEFAULT_CONFIG,
  decide,
  needsConfirmation,
  type BatchScores,
} from './score.mts';

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
