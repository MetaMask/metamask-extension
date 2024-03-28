import path from 'path';
import fs from 'fs';
import { uniq } from 'lodash';
import fg from 'fast-glob';
import madge from '@lgbot/madge';
import {
  ROOT_DIRECTORY_PATH,
  ENTRYPOINT_PATTERNS,
  FILES_TO_CONVERT_PATH,
} from '../common/constants';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * The entrypoint to this script.
 *
 * Uses the `madge` package to traverse the dependency graph of a set of
 * entrypoints (a combination of the ones that the build script uses to build
 * the extension as well as a manually picked list), outputting a JSON array
 * containing all JavaScript files that need to be converted to TypeScript.
 */
async function main(): Promise<void> {
  const existingFilePaths = JSON.parse(
    fs.readFileSync(FILES_TO_CONVERT_PATH, 'utf8'),
  );

  const entrypoints = (
    await Promise.all(
      ENTRYPOINT_PATTERNS.map((entrypointPattern) => {
        return fg(
          path.resolve(ROOT_DIRECTORY_PATH, `${entrypointPattern}.{js,ts,tsx}`),
        );
      }),
    )
  )
    .flat()
    .filter((filePath) => {
      return !/^(?:\.storybook|node_modules)\//u.test(
        path.relative(ROOT_DIRECTORY_PATH, filePath),
      );
    })
    .sort();
  console.log(
    `Traversing dependency trees for ${entrypoints.length} entrypoints, please wait...`,
  );

  const dependenciesByFilePath = (
    await madge(entrypoints, {
      baseDir: ROOT_DIRECTORY_PATH,
    })
  ).obj();
  const newFilePaths = Object.keys(dependenciesByFilePath)
    .filter((filePath) => {
      return (
        /\.jsx?$/u.test(filePath) &&
        !/^\./u.test(filePath) &&
        // Filter this out again because some imports may refer to NPM modules
        !/^node_modules\//u.test(filePath)
      );
    })
    .sort();
  const updatedFilePaths = uniq(existingFilePaths.concat(newFilePaths));

  fs.writeFileSync(
    FILES_TO_CONVERT_PATH,
    JSON.stringify(updatedFilePaths, null, '  '),
  );
  console.log(
    `${path.relative(process.cwd(), FILES_TO_CONVERT_PATH)} written with ${
      updatedFilePaths.length
    } modules.`,
  );
}
