/**
 * Copies a base and a head build into the A and B directories for the
 * same-machine A/B benchmark.
 * Usage: node test/e2e/benchmarks/prepare-ab-builds.mts --browser chrome --base-source DIR --head-source DIR --out summary.json [--inject-head-ms N]
 * --inject-head-ms adds a busy-wait of N milliseconds to the head build, as a positive control.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { preparePairBuilds } from './utils/ab-pilot-builds.ts';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      browser: { type: 'string' },
      'base-source': { type: 'string' },
      'head-source': { type: 'string' },
      out: { type: 'string' },
      'inject-head-ms': { type: 'string' },
    },
  });
  const { browser, out } = values;
  const baseSource = values['base-source'];
  const headSource = values['head-source'];
  if (browser !== 'chrome' && browser !== 'firefox') {
    throw new Error('--browser chrome|firefox is required');
  }
  if (!baseSource || !headSource) {
    throw new Error('--base-source and --head-source are required');
  }

  const injectMs =
    values['inject-head-ms'] === undefined
      ? undefined
      : Number(values['inject-head-ms']);
  if (injectMs !== undefined && !(Number.isFinite(injectMs) && injectMs >= 0)) {
    throw new Error('--inject-head-ms must be a non-negative number');
  }

  const summary = preparePairBuilds({
    browser,
    baseSource,
    headSource,
    injectHeadMs: injectMs,
  });
  console.log(JSON.stringify(summary, null, 2));

  if (out) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, JSON.stringify(summary, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
