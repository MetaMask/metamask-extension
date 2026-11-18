/**
 * Prepares the two build copies for the same-machine A/B pilot.
 * Usage: node test/e2e/benchmarks/prepare-ab-builds.mts --browser chrome --source dist/chrome --out summary.json [--inject-ms N] [--inject-site first|middle|last|INDEX]
 * Pair mode: --base-source DIR --head-source DIR instead of --source copies two real builds into A (base) and B (head); --inject-head-ms N then adds a busy-wait to B.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  getHomeScript,
  getInjectionSnippet,
  prepareAbBuilds,
  preparePairBuilds,
} from './utils/ab-pilot-builds.ts';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      browser: { type: 'string' },
      source: { type: 'string' },
      'base-source': { type: 'string' },
      'head-source': { type: 'string' },
      out: { type: 'string' },
      'inject-ms': { type: 'string' },
      'inject-site': { type: 'string' },
      'inject-head-ms': { type: 'string' },
    },
  });
  const { browser, source, out } = values;
  const baseSource = values['base-source'];
  const headSource = values['head-source'];
  if (browser !== 'chrome' && browser !== 'firefox') {
    throw new Error('--browser chrome|firefox is required');
  }
  const injectMs =
    values['inject-ms'] === undefined ? undefined : Number(values['inject-ms']);
  const injectHeadMs =
    values['inject-head-ms'] === undefined
      ? undefined
      : Number(values['inject-head-ms']);

  const pair = baseSource !== undefined || headSource !== undefined;
  if (pair === (source !== undefined)) {
    throw new Error('Pass --source, or both --base-source and --head-source');
  }
  let summary;
  if (pair) {
    if (!baseSource || !headSource) {
      throw new Error('Pair mode needs --base-source and --head-source');
    }
    summary = preparePairBuilds({
      browser,
      baseSource,
      headSource,
    });
    if (injectHeadMs !== undefined) {
      // Dry-run positive control: slow the head copy by a known amount.
      const directory = summary.directories.B;
      const target = path.join(directory, getHomeScript(directory, 'last'));
      const original = await fs.readFile(target, 'utf8');
      await fs.writeFile(target, getInjectionSnippet(injectHeadMs) + original);
    }
  } else {
    summary = prepareAbBuilds({
      browser,
      sourceDirectory: source as string,
      injectMs,
      injectSite: values['inject-site'],
    });
  }
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
