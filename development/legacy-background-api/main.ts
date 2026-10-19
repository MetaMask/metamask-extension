import type { Writable } from 'node:stream';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { check } from './check';
import { CommandError } from './command-error';
import { SNAPSHOT_PATH } from './constants';
import { update } from './update';

/**
 * Dispatches the `check` and `update` commands for the legacy background API
 * snapshot.
 *
 * @param options - The command-line arguments and output streams.
 * @param options.argv - The full process argument vector (including the node
 * binary and script path).
 * @param options.stdout - Where command output is written.
 * @param options.stderr - Where command errors are written.
 */
export async function main({
  argv,
  stdout,
  stderr,
}: {
  argv: string[];
  stdout: Writable;
  stderr: Writable;
}): Promise<void> {
  const cli = yargs(hideBin(argv))
    .scriptName('legacy-background-api')
    .usage(
      'Checks or updates the snapshot of names that the legacy background APIs are allowed to have.',
    )
    .command({
      command: 'check',
      describe: `Fail if the legacy background APIs do not match ${SNAPSHOT_PATH}.`,
      handler: () => {
        check({ stdout, stderr });
      },
    })
    .command({
      command: 'update',
      describe: `Update ${SNAPSHOT_PATH} to match the legacy background APIs.`,
      handler: async () => {
        await update({ stdout });
      },
    })
    .demandCommand(1, 'Please specify a command.')
    .strict()
    // By default yargs prints usage and calls `process.exit` on a validation
    // error (e.g. an unknown or missing command). This callback instead prints
    // the help text and re-throws, so `parseAsync` rejects and the caller can
    // handle the error. A `CommandError` means a command already reported its
    // own failure, so the help text is suppressed for it (but still re-thrown
    // so the process exits non-zero).
    .fail((message, error) => {
      if (!(error instanceof CommandError)) {
        cli.showHelp((help) => stderr.write(`${help}\n`));
      }
      throw error ?? new Error(message);
    });

  await cli.parseAsync();
}
