import fs from 'fs';
import * as path from 'path';
import { createSandbox } from '@metamask/utils/node';

/**
 * Helpers for manipulating the temporary directory that
 * {@link withinTemporaryDirectory} creates.
 */
type TemporaryDirectoryHelpers = {
  /**
   * Writes a file in the temporary directory, creating any directories leading
   * up to it.
   */
  writeFile: (filePath: string, contents: string) => void;
};

/**
 * Runs a function inside a new temporary directory.
 *
 * Fitness functions that inspect specific files read them relative to the
 * current working directory, just as they do when run from the root of the
 * repository. Tests use this to exercise that same code against real files
 * instead of injecting file contents.
 *
 * The directory is made the current working directory while the function
 * runs; afterward, the previous working directory is restored and the
 * directory is removed, even if the function throws. The returned promise
 * must be awaited, as the function does not run synchronously.
 *
 * @param callback - The function to run.
 */
export async function withinTemporaryDirectory(
  callback: (helpers: TemporaryDirectoryHelpers) => void | Promise<void>,
): Promise<void> {
  const { withinSandbox } = createSandbox('fitness-functions');

  await withinSandbox(async ({ directoryPath }) => {
    const originalWorkingDirectoryPath = process.cwd();
    process.chdir(directoryPath);

    try {
      await callback({ writeFile });
    } finally {
      process.chdir(originalWorkingDirectoryPath);
    }
  });
}

/**
 * Writes a file relative to the current working directory, creating any
 * directories leading up to it.
 *
 * @param filePath - The path of the file, relative to the current working
 * directory.
 * @param contents - The contents of the file.
 */
function writeFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}
