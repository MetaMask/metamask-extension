import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import madge from 'madge';
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
  const entrypoints = (
    await Promise.all(
      ENTRYPOINT_PATTERNS.map((entrypointPattern) => {
        return fg(
          path.resolve(ROOT_DIRECTORY_PATH, `${entrypointPattern}.{js,ts,tsx}`),
        );
      }),
    )
  ).flat();
  console.log(
    `Traversing dependency trees for ${entrypoints.length} entrypoints, please wait...`,
  );
  const result = await madge(entrypoints, {
    baseDir: ROOT_DIRECTORY_PATH,
  });
  const dependenciesByFilePath = result.obj();
  const sortedFilePaths = Object.keys(dependenciesByFilePath)
    .sort()
    .filter((filePath) => {
      return (
        /\.(?:js|tsx?)$/u.test(filePath) &&
        !/^(?:\.storybook|node_modules)\//u.test(filePath)
      );
    });

  fs.writeFileSync(
    FILES_TO_CONVERT_PATH,
    JSON.stringify(sortedFilePaths, null, '  '),
  );
  console.log(
    `${path.relative(process.cwd(), FILES_TO_CONVERT_PATH)} written with ${
      sortedFilePaths.length
    } modules.`,
  );
}
