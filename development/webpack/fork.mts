/**
 * @file Executes the build process in a child process environment, ensuring it
 * was correctly spawned by checking for a `PPID` environment variable that
 * matches the parent's process ID. This script is responsible for running the
 * build logic defined in './build' and managing output streams to prevent
 * unwanted output after completion. It leverages IPC for communication back to
 * the parent process or falls back to sending a POSIX signal (`SIGUSR2`) to
 * signal completion.
 * @see {@link ./launch.ts}
 */

const PPID = Number(process.env.PPID);
if (isNaN(PPID) || PPID !== process.ppid) {
  throw new Error(
    `${__filename} must be run with a \`PPID\` environment variable. See ${__dirname}/launch.ts for an example.`,
  );
}

const { build } = await import('./build.ts');
build(() => {
  // stop writing now because the parent process is still listening to these
  // streams and we don't want any more output to be shown to the user.
  process.stdout.write = process.stderr.write = () => true;

  // use IPC if we have it, otherwise send a POSIX signal
  process.send?.('SIGUSR2') || process.kill(PPID, 'SIGUSR2');
});
