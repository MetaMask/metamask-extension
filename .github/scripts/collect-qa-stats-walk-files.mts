/**
 * Shared filesystem helpers for QA stats collectors (E2E spec discovery, static scans).
 */

import { readdir } from 'fs/promises';
import { join } from 'path';
import type { Dirent } from 'fs';

/** E2E Playwright/Jest spec filenames under `test/e2e`. */
export const PATTERN_E2E_SPEC_FILE = /\.spec\.(ts|js)$/u;

/**
 * Recursively collects file paths under `dir` that satisfy `predicate(filename)`.
 *
 * @param dir - Directory to walk.
 * @param predicate - Returns true for filenames to include.
 */
export async function walkFiles(
  dir: string,
  predicate: (name: string) => boolean,
): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results; // directory does not exist — skip silently
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(fullPath, predicate)));
    } else if (entry.isFile() && predicate(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}
