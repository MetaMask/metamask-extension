import { exitWithError } from '../../development/lib/exit-with-error';

async function main(): Promise<void> {
  return;
}

main().catch((error) => {
  exitWithError(error);
});
