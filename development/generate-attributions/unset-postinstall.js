const path = require('node:path');
const { readFile, writeFile } = require('node:fs/promises');

const rootDirectory = path.resolve(__dirname, '..', '..');
const packageJsonPath = path.join(rootDirectory, 'package.json');

async function main() {
  const packageJsonContents = await readFile(packageJsonPath, { encoding: 'utf8' });
  const packageJson = JSON.parse(packageJsonContents);
  delete packageJson.scripts.postinstall;
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
