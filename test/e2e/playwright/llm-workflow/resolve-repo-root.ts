import path from 'path';
import { existsSync, readFileSync } from 'fs';

const REPO_PACKAGE_NAME = 'metamask-crx';

/**
 * Walk up from `startDir` until we find a `package.json` whose `name` field
 * equals {@link REPO_PACKAGE_NAME}.  This lets every file in the tree resolve
 * the repository root without fragile `../..` chains or reliance on
 * `process.cwd()` (which points to the IDE/client directory when launched
 * via MCP).
 *
 * @param startDir - Directory to start searching from. Defaults to `__dirname`
 * of the caller — pass it explicitly so the walk starts from the right place.
 * @returns Absolute path to the repository root.
 */
export function resolveRepoRoot(startDir: string = __dirname): string {
  let dir = path.resolve(startDir);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, 'package.json');
    if (existsSync(candidate)) {
      try {
        const pkg = JSON.parse(readFileSync(candidate, 'utf-8'));
        if (pkg.name === REPO_PACKAGE_NAME) {
          return dir;
        }
      } catch {
        // malformed JSON — keep walking
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not locate repository root (package "${REPO_PACKAGE_NAME}"). ` +
          `Started from: ${startDir}`,
      );
    }
    dir = parent;
  }
}
