import * as fs from 'fs';
import * as path from 'path';

const BASE_PATH: string = path.resolve(__dirname, '..', '..');
const CHANGED_FILES_PATH: string = path.join(
  BASE_PATH,
  'changed-files',
  'changed-files.txt',
);

/**
 * Reads the list of changed files from the git diff file.
 *
 * @returns An array of changed file paths.
 */
function readChangedFiles(): string[] {
  try {
    const data: string = fs.readFileSync(CHANGED_FILES_PATH, 'utf8');
    const changedFiles: string[] = data.split('\n');
    return changedFiles;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Error reading from file:', error);
    }
    return [];
  }
}

/**
 * Filters E2E changed files from a list of changed files.
 *
 * @param files - The list of changed files.
 * @returns The filtered list of E2E files.
 */
function filterE2eChangedFiles(files: string[]): string[] {
  return files.filter((file) => file.includes('test/e2e'));
}

export { filterE2eChangedFiles, readChangedFiles };
