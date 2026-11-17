/**
 * Prepares the two build copies for the same-machine A/B pilot.
 * Usage: yarn tsx test/e2e/benchmarks/prepare-ab-builds.ts --browser chrome --source dist/chrome --out summary.json [--inject-ms N] [--inject-site first|middle|last|INDEX]
 * Pair mode: --base-source DIR --head-source DIR instead of --source copies two real builds into A (base) and B (head); --inject-head-ms N then adds a busy-wait to B.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getHomeScript,
  getInjectionSnippet,
  prepareAbBuilds,
  preparePairBuilds,
} from './utils/ab-pilot-builds';

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('browser', {
      choices: ['chrome', 'firefox'] as const,
      demandOption: true,
      type: 'string',
    })
    .option('source', { type: 'string' })
    .option('base-source', { type: 'string' })
    .option('head-source', { type: 'string' })
    .option('out', { type: 'string' })
    .option('inject-ms', { type: 'number' })
    .option('inject-site', { type: 'string' })
    .option('inject-head-ms', { type: 'number' })
    .parseAsync();

  const pair = argv.baseSource !== undefined || argv.headSource !== undefined;
  if (pair === (argv.source !== undefined)) {
    throw new Error('Pass --source, or both --base-source and --head-source');
  }
  let summary;
  if (pair) {
    if (!argv.baseSource || !argv.headSource) {
      throw new Error('Pair mode needs --base-source and --head-source');
    }
    summary = preparePairBuilds({
      browser: argv.browser,
      baseSource: argv.baseSource,
      headSource: argv.headSource,
    });
    if (argv.injectHeadMs !== undefined) {
      // Dry-run positive control: slow the head copy by a known amount.
      const directory = summary.directories.B;
      const target = path.join(directory, getHomeScript(directory, 'last'));
      const original = await fs.readFile(target, 'utf8');
      await fs.writeFile(
        target,
        getInjectionSnippet(argv.injectHeadMs) + original,
      );
    }
  } else {
    summary = prepareAbBuilds({
      browser: argv.browser,
      sourceDirectory: argv.source as string,
      injectMs: argv.injectMs,
      injectSite: argv.injectSite,
    });
  }
  console.log(JSON.stringify(summary, null, 2));

  if (argv.out) {
    await fs.mkdir(path.dirname(argv.out), { recursive: true });
    await fs.writeFile(argv.out, JSON.stringify(summary, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});
