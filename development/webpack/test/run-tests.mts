import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const requestedFiles = (process.env.WEBPACK_TEST_FILES ?? '')
  .split(',')
  .filter(Boolean)
  .map((file) => resolve(file));
const testFiles =
  requestedFiles.length === 0
    ? readdirSync(testDirectory)
        .filter((file) => file.endsWith('.test.ts'))
        .map((file) => join(testDirectory, file))
    : requestedFiles;

for (const testFile of testFiles.sort()) {
  require(testFile);
}
