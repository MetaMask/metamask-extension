import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

/**
 * Finds the checkout when a build is launched from another working directory.
 *
 * @param entry - The process entry point.
 * @param cwd - The current working directory.
 * @returns The project root.
 */
export function findProjectRoot(
  entry = process.argv[1],
  cwd = process.cwd(),
): string {
  for (const start of [entry && dirname(resolve(entry)), cwd]) {
    if (!start) {
      continue;
    }
    let directory = start;
    while (true) {
      if (
        existsSync(join(directory, 'builds.yml')) &&
        existsSync(join(directory, 'package.json'))
      ) {
        return directory;
      }
      const parent = dirname(directory);
      if (parent === directory) {
        break;
      }
      directory = parent;
    }
  }
  throw new Error('Could not find the MetaMask Extension project root.');
}

export const projectRoot = findProjectRoot();

// Resolve paths without executing dependencies outside LavaMoat's loader.
export const resolvePackage = createRequire(
  join(projectRoot, 'package.json'),
).resolve;

const compiled = typeof require === 'function';
export const webpackDirectory = join(
  projectRoot,
  'development',
  ...(compiled ? ['.webpack', 'development'] : []),
  'webpack',
);

/**
 * Returns a tooling file in either the native TypeScript or compiled CJS tree.
 *
 * @param filename - The file relative to the webpack directory, without its extension.
 * @returns The absolute file path.
 */
export function webpackFile(filename: string): string {
  return join(webpackDirectory, `${filename}.${compiled ? 'js' : 'ts'}`);
}
