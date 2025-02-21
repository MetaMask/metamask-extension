const path = require('node:path');
const { readFile, writeFile } = require('node:fs/promises');

const rootDirectory = path.resolve(__dirname, '..', '..');
const packageJsonPath = path.join(rootDirectory, 'package.json');

/**
 * Unset the root `postinstall` script.
 *
 * This is used when generating attributions, to prevent development dependencies from being used
 * or installed during `postinstall`.
 */
async function main() {
  const packageJsonContents = await readFile(packageJsonPath, {
    encoding: 'utf8',
  });
  const packageJson = JSON.parse(packageJsonContents);
  delete packageJson.scripts.postinstall;
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
