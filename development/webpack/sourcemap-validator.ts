/**
 * @file Validates source maps for the webpack-built extension.
 *
 * Discovers all .js bundles in dist/chrome that have a .map file, then for each
 * bundle finds "new Error" in the built code and verifies the source map
 * correctly maps those positions back to the original source containing "new Error".
 * If it's not working, it may error or print minified garbage.
 *
 * Run after a webpack production/test build, e.g.:
 * yarn webpack
 * yarn validate-source-maps:webpack
 */

import { access, readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { SourceMapConsumer } from 'source-map';
import { codeFrameColumns } from '@babel/code-frame';

const PLATFORM = 'chrome';

const TARGET_STRING = 'new Error';

/**
 * Returns true if the bundle line at the given position is likely a comment
 * (JSDoc, line comment, or block comment). Source maps often don't map
 * comment positions, so we skip these to avoid false "missing source" failures.
 *
 * @param line - A single line of bundle output (may be trimmed internally).
 * @returns True if the line appears to be a comment or blank; false for code.
 */
export function isLikelyCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('*') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*/') ||
    trimmed === '' ||
    /^\s*$/u.test(line)
  );
}

/** Max line length we treat as "normal"; longer lines are assumed minified/vendor. */
const MINIFIED_LINE_LENGTH_THRESHOLD = 1000;

/**
 * Returns true if the line is likely from minified or vendor code (one very long
 * line). Such code often has sparse source maps, so we skip "missing source"
 * for these to avoid failing on bundled dependencies.
 *
 * @param line - A single line of bundle output.
 * @returns True if the line length exceeds the minified threshold.
 */
export function isLikelyMinifiedLine(line: string): boolean {
  return line.length > MINIFIED_LINE_LENGTH_THRESHOLD;
}

/**
 * A JS bundle and its source map file paths, plus a short label for logging.
 */
export type FilePair = {
  /** Absolute path to the built .js bundle. */
  jsPath: string;
  /** Absolute path to the .js.map source map file. */
  mapPath: string;
  /** Human-readable label (e.g. relative path from dist/chrome) for console output. */
  label: string;
};

/**
 * Entry point: discovers all webpack bundles in dist/chrome, validates each
 * bundle's source map, and exits with code 1 if any validation fails.
 */
export async function main(): Promise<void> {
  const chromeDir = join(process.cwd(), 'dist', PLATFORM);
  let chromeDirExists = false;
  try {
    const st = await stat(chromeDir);
    chromeDirExists = st.isDirectory();
  } catch {
    // ENOENT or other; treat as missing
  }

  if (!chromeDirExists) {
    console.error(
      `SourcemapValidator (webpack) - dist/chrome/ does not exist or is not a directory. Run a webpack build first (e.g. yarn webpack). Exiting with code 1.`,
    );
    process.exit(1);
  }

  const pairs = await discoverWebpackBundles();
  if (pairs.length === 0) {
    console.error(
      'SourcemapValidator (webpack) - no .js+.map pairs found in dist/chrome/. Run a webpack build first and ensure bundles and their .map files are present. Exiting with code 1.',
    );
    process.exit(1);
  }

  console.log(
    `SourcemapValidator (webpack) - validating ${pairs.length} bundle(s)\n`,
  );

  let valid = true;
  for (const { jsPath, mapPath, label } of pairs) {
    const ok = await validateBundle({ jsPath, mapPath, label });
    valid = valid && ok;
  }

  if (!valid) {
    console.error(
      'SourcemapValidator (webpack) - one or more bundles failed validation. Exiting with code 1.',
    );
    process.exit(1);
  }

  console.log(
    `SourcemapValidator (webpack) - all ${pairs.length} bundle(s) validated successfully.`,
  );
}

/**
 * Recursively finds all .js files in dist/chrome that have a sibling .map file.
 * Skips directories whose names start with '_' or equal 'vendor'.
 *
 * @returns Sorted array of { jsPath, mapPath, label } for each bundle (label is path relative to dist/chrome).
 */
export async function discoverWebpackBundles(): Promise<FilePair[]> {
  const chromeDir = join(process.cwd(), 'dist', PLATFORM);
  const pairs: FilePair[] = [];

  /**
   * Recursively scans a directory for .js files that have a sibling .map file;
   * pushes each pair onto the outer `pairs` array. Skips _* and vendor dirs.
   *
   * @param dir - Absolute path to the directory to scan.
   */
  async function scanDir(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isFile() && e.name.endsWith('.js') && !e.name.endsWith('.min.js')) {
        const mapPath = `${full}.map`;
        try {
          await access(mapPath);
          pairs.push({
            jsPath: full,
            mapPath,
            label: relative(chromeDir, full),
          });
        } catch {
          // no .map, skip
        }
      } else if (
        e.isDirectory() &&
        !e.name.startsWith('_') &&
        e.name !== 'vendor'
      ) {
        await scanDir(full);
      }
    }
  }

  await scanDir(chromeDir);
  return pairs.sort((a, b) => a.jsPath.localeCompare(b.jsPath));
}

/**
 * Validates one bundle's source map by sampling positions of "new Error" in the
 * built JS and checking that the map resolves to original source containing
 * "new Error". Logs errors for missing source, missing source content, or
 * incorrect mapping; comment-like lines with no mapping are skipped.
 *
 * @param options - Bundle paths and label (see FilePair).
 * @param options.jsPath - Absolute path to the built .js bundle.
 * @param options.mapPath - Absolute path to the .js.map source map file.
 * @param options.label - Human-readable label for console output.
 * @returns True if all sampled positions validated; false on any failure or I/O error.
 */
export async function validateBundle({
  jsPath,
  mapPath,
  label,
}: FilePair): Promise<boolean> {
  console.log(`build "${label}"`);

  let rawBuild: string;
  try {
    rawBuild = await readFile(jsPath, 'utf8');
  } catch {
    console.error(
      `SourcemapValidator (webpack) - failed to load source file for "${label}"`,
    );
    return false;
  }

  let rawSourceMap: string;
  try {
    rawSourceMap = await readFile(mapPath, 'utf8');
  } catch {
    console.error(
      `SourcemapValidator (webpack) - failed to load sourcemap for "${label}"`,
    );
    return false;
  }

  const consumer = await new SourceMapConsumer(rawSourceMap);

  if (!consumer.hasContentsOfAllSources()) {
    console.warn(
      'SourcemapValidator (webpack) - missing content of some sources...',
    );
  }

  console.log(`  sampling from ${consumer.sources.length} files`);
  let sampleCount = 0;
  let valid = true;

  const buildLines = rawBuild.split('\n');
  for (let lineIndex = 0; lineIndex < buildLines.length; lineIndex++) {
    const line = buildLines[lineIndex];
    const matchIndices = indicesOf(TARGET_STRING, line);
    for (const matchColumn of matchIndices) {
      const position = { line: lineIndex + 1, column: matchColumn };
      const result = consumer.originalPositionFor(position);

      if (!result.source) {
        if (isLikelyCommentLine(line)) {
          continue;
        }
        if (isLikelyMinifiedLine(line)) {
          continue;
        }
        sampleCount += 1;
        valid = false;
        const location = {
          start: { line: position.line, column: position.column + 1 },
        };
        const codeSample = codeFrameColumns(rawBuild, location, {
          message: 'missing source for position',
          highlightCode: true,
        });
        console.error(
          `missing source for position, in bundle "${label}"\n${codeSample}`,
        );
        continue;
      }

      sampleCount += 1;

      const sourceContent = consumer.sourceContentFor(result.source);
      if (sourceContent === null) {
        valid = false;
        console.error(
          `SourcemapValidator (webpack) - no source content for "${result.source}", in bundle "${label}"`,
        );
        continue;
      }

      const sourceLines = sourceContent.split('\n');
      const sourceLineIndex = (result.line ?? 1) - 1;
      const sourceLine = sourceLines[sourceLineIndex];
      const column = result.column ?? 0;
      const portion = sourceLine ? sourceLine.slice(column) : '';
      const foundValidSource = portion.includes(TARGET_STRING);

      if (!foundValidSource) {
        valid = false;
        const location = {
          start: {
            line: result.line ?? 1,
            column: column + 1,
          },
        };
        const codeSample = codeFrameColumns(sourceContent, location, {
          message: `expected to see ${JSON.stringify(TARGET_STRING)}`,
          highlightCode: true,
        });
        console.error(
          `Sourcemap seems invalid, ${result.source}\n${codeSample}`,
        );
      }
    }
  }

  console.log(`  checked ${sampleCount} samples`);
  return valid;
}

/**
 * Returns all indices at which `substring` appears in `str`, in ascending order.
 *
 * @param substring - The substring to search for.
 * @param str - The string to search in.
 * @returns Array of 0-based indices; empty if substring is not found.
 */
export function indicesOf(substring: string, str: string): number[] {
  const a: number[] = [];
  let i = -1;
  while ((i = str.indexOf(substring, i + 1)) >= 0) {
    a.push(i);
  }
  return a;
}

/**
 * Runs main() when not in test mode. Used at load time and exported for tests.
 */
export async function runEntryPoint(): Promise<void> {
  if (
    typeof process !== 'undefined' &&
    !process.env.SOURCEMAP_VALIDATOR_SKIP_MAIN
  ) {
    try {
      await main();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

void runEntryPoint();
