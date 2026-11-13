import { CommandError } from './legacy-background-api/command-error';
import { main } from './legacy-background-api/main';

main({
  argv: process.argv,
  stdout: process.stdout,
  stderr: process.stderr,
}).catch((error) => {
  // If a command fails, assume it's already reported its own failure.
  if (!(error instanceof CommandError)) {
    console.error(error);
  }
  process.exitCode = 1;
});
