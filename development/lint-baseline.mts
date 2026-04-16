import path from 'node:path';
import fs from 'node:fs/promises';

import prettier from 'prettier';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

const projectRoot = path.resolve(import.meta.dirname, '..');

/**
 * The console baseline file format.
 */
type ConsoleBaseline = { files: Record<string, unknown> };

/**
 * The lint status of a single console baseline file.
 */
type LintStatus = (typeof LINT_STATUS)[keyof typeof LINT_STATUS];

/**
 * Lint statuses for a single console baseline file.
 */
const LINT_STATUS = {
  OK: 'OK',
  ERROR: 'ERROR',
} as const;

/**
 * Get the path of the given console baseline file, relative to the project root.
 *
 * @param filename - The console baseline filename.
 * @returns The path of the console baseline file, relative to the project root.
 */
function getBaselinePath(filename: string): string {
  return path.join(projectRoot, 'test', 'jest', filename);
}

/**
 * Return the console baseline file with the given filename.
 *
 * @param filename - The filename to read.
 * @returns The parsed console baseline file.
 */
async function readBaseline(filename: string): Promise<ConsoleBaseline> {
  const rawBaseline = await fs.readFile(getBaselinePath(filename), {
    encoding: 'utf8',
  });
  const baseline = JSON.parse(rawBaseline);
  if (!baseline.files) {
    throw new Error(
      `Console baseline file '${filename}' missing 'files' property`,
    );
  }
  return baseline;
}

/**
 * Write the given baseline file.
 *
 * @param args - Arguments.
 * @param args.baseline - The baseline file to write.
 * @param args.filename - The baseline filename.
 */
async function writeBaseline({
  baseline,
  filename,
}: {
  baseline: ConsoleBaseline;
  filename: string;
}): Promise<void> {
  // Write JSON with Prettier formatting
  const baselinePath = getBaselinePath(filename);
  const prettierOptions = await prettier.resolveConfig(baselinePath);
  const formatted = await prettier.format(
    `${JSON.stringify(baseline, null, 2)}\n`,
    {
      // get options from .prettierrc
      ...prettierOptions,
      filepath: baselinePath,
    },
  );
  await fs.writeFile(
    baselinePath,
    formatted,
    { encoding: 'utf8' },
  );
}

/**
 * Return the list of files in the given console baseline file.
 *
 * @param filename - The filename to read.
 * @returns The list of files in the console baseline file.
 */
async function getBaselineFiles(filename: string): Promise<string[]> {
  const baseline = await readBaseline(filename);
  return Object.keys(baseline.files);
}

/**
 * Return the files from the given array that are not found on-disk.
 *
 * @param files - The files to check.
 * @returns A list of missing files.
 */
async function detectMissingFiles(files: string[]): Promise<string[]> {
  const fileStatEntries: { filePath: string; exists: boolean }[] =
    await Promise.all(
      files.map(async (filePath: string) => {
        const absoluteFilePath = path.join(projectRoot, filePath);
        try {
          await fs.stat(absoluteFilePath);
          return { filePath, exists: true };
        } catch (error) {
          if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ENOENT'
          ) {
            return { filePath, exists: false };
          }
          throw error;
        }
      }),
    );

  return fileStatEntries
    .filter(({ exists }) => !exists)
    .map(({ filePath }) => filePath);
}

/**
 * Remove the given files from the given baseline file.
 *
 * @param args - Arguments.
 * @param args.filename - The baseline file to update.
 * @param args.missingFiles - The files to remove.
 */
async function removeMissingFiles({
  filename,
  missingFiles,
}: {
  filename: string;
  missingFiles: string[];
}): Promise<void> {
  const baseline = await readBaseline(filename);
  for (const filePath of missingFiles) {
    delete baseline.files[filePath];
  }
  await writeBaseline({ baseline, filename });
}

/**
 * Print a console message about the given missing files.
 *
 * @param args - Arguments.
 * @param args.filename - The baseline file with missing files.
 * @param args.missingFiles - The missing files.
 */
async function printMissingFiles({
  filename,
  missingFiles,
}: {
  filename: string;
  missingFiles: string[];
}): Promise<void> {
  console.log(`Missing files detected in '${filename}':`);
  for (const filePath of missingFiles) {
    console.log(`  - ${filePath}`);
  }
  console.log('');
}

/**
 * Lint the given baseline file, ensuring no non-existent files are present.
 *
 * @param options - Lint options
 * @param options.filename - The baseline file to lint.
 * @param options.fix - Whether to fix discovered lint violations.
 */
async function lintConsoleBaseline({
  filename,
  fix,
}: {
  filename: string;
  fix: boolean;
}): Promise<LintStatus> {
  const files = await getBaselineFiles(filename);
  const missingFiles = await detectMissingFiles(files);

  if (!missingFiles.length) {
    return LINT_STATUS.OK;
  }

  if (fix) {
    await removeMissingFiles({ filename, missingFiles });
  } else {
    printMissingFiles({ filename, missingFiles });
  }
  return LINT_STATUS.ERROR;
}

/**
 * Lint all console baseline files.
 */
async function main(): Promise<void> {
  const argv = yargs(hideBin(process.argv))
    .usage('$0 [options]', 'Lint console baseline files')
    .options({
      fix: {
        description: 'Automatically fix lint violations.',
        type: 'boolean',
        default: false,
      },
    })
    .strict()
    .parseSync();

  const { fix } = argv;
  const baselineFiles = [
    'console-baseline-unit.json',
    'console-baseline-integration.json',
  ];
  console.log(`Linting baseline files '${baselineFiles}'`);

  const statuses = await Promise.all(
    baselineFiles.map((filename) => lintConsoleBaseline({ filename, fix })),
  );

  if (statuses.every((status: LintStatus) => status === LINT_STATUS.OK)) {
    console.log('No lint errors found.');
  } else if (fix) {
    console.log('Lint errors fixed.');
  } else {
    console.log('Lint errors found. To fix, run "yarn lint:baseline:fix".');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
