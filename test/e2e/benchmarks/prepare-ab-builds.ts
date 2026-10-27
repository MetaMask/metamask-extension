/**
 * Prepares the two build copies for the same-machine A/B pilot.
 * Usage: yarn tsx test/e2e/benchmarks/prepare-ab-builds.ts --browser chrome --source dist/chrome --out summary.json
 */
import { promises as fs } from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import { prepareAbBuilds } from './utils/ab-pilot-builds';

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('browser', {
      choices: ['chrome', 'firefox'] as const,
      demandOption: true,
      type: 'string',
    })
    .option('source', { demandOption: true, type: 'string' })
    .option('out', { type: 'string' })
    .parseAsync();

  const summary = prepareAbBuilds({
    browser: argv.browser,
    sourceDirectory: argv.source,
  });
  console.log(JSON.stringify(summary, null, 2));

  if (argv.out) {
    await fs.mkdir(path.dirname(argv.out), { recursive: true });
    await fs.writeFile(argv.out, JSON.stringify(summary, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});
