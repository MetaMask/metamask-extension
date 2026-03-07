/**
 * @file Validates source maps for the webpack-built extension.
 *
 * Discovers all .js bundles in dist/chrome that have a .map file in the
 * selected location (sibling or dist/sourcemaps), then for each bundle finds
 * "new Error" in the built code and verifies the source map
 * correctly maps those positions back to the original source containing "new Error".
 * If it's not working, it may error or print minified garbage.
 *
 * Run after a webpack production/test build, e.g.:
 * yarn webpack
 * yarn validate-source-maps:webpack
 */

import { access, readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type {
  BasicSourceMapConsumer,
  IndexedSourceMapConsumer,
} from 'source-map';
import { SourceMapConsumer } from 'source-map';
import { codeFrameColumns } from '@babel/code-frame';

const PLATFORM = 'chrome';
const SOURCEMAPS_DIRNAME = 'sourcemaps';
const CONTENTSCRIPT_RELATIVE_PATH = 'scripts/contentscript.js';
const CONTENTSCRIPT_SOURCEMAP_REFERENCE =
  '//# sourceMappingURL=contentscript.js.map';

const TARGET_STRING = 'new Error';

function toPosixPath(pathValue: string): string {
  return pathValue.replace(/\\/gu, '/');
}

export const MAP_LOCATIONS = ['sibling', 'sourcemaps'] as const;
export type MapLocation = (typeof MAP_LOCATIONS)[number];

export type SourceMapValidatorOptions = {
  mapLocation?: MapLocation;
};

type DiscoverWebpackBundlesOptions = {
  mapLocation: MapLocation;
};

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
  if (trimmed.includes('*/')) {
    const afterBlock = trimmed.split('*/').slice(1).join('*/').trim();
    if (afterBlock !== '' && afterBlock.includes(TARGET_STRING)) {
      return false;
    }
  }
  return (
    trimmed.startsWith('*') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*/') ||
    trimmed === ''
  );
}

/**
 * Returns true if the line at buildLines[lineIndex] is inside an unclosed
 * multiline block comment. Used to skip "missing source" for code that
 * appears only inside commented-out blocks in the bundle.
 *
 * @param buildLines - All lines of the bundle.
 * @param lineIndex - Index of the current line (0-based).
 * @returns True if we're inside a block comment at the end of that line.
 */
export function isInsideMultilineBlockComment(
  buildLines: string[],
  lineIndex: number,
): boolean {
  let inBlock = false;
  for (let i = 0; i <= lineIndex; i++) {
    const line = buildLines[i];
    let searchFrom = 0;
    while (searchFrom < line.length) {
      const open = line.indexOf('/*', searchFrom);
      const close = line.indexOf('*/', searchFrom);
      if (open === -1 && close === -1) break;
      if (close !== -1 && (open === -1 || close < open)) {
        inBlock = false;
        searchFrom = close + 2;
      } else {
        inBlock = true;
        searchFrom = open + 2;
      }
    }
  }
  return inBlock;
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
 * Detects where webpack output stores source maps by checking whether
 * dist/chrome/scripts/contentscript.js ends with a sourceMappingURL reference.
 *
 * If the reference is present, maps are expected as sibling files in dist/chrome.
 * Otherwise maps are expected under dist/sourcemaps.
 *
 * @param chromeDir - Absolute path to dist/chrome.
 * @returns The detected map location.
 * @throws If contentscript.js cannot be read.
 */
export async function detectMapLocationFromContentscript(
  chromeDir: string,
): Promise<MapLocation> {
  const contentScriptPath = join(chromeDir, CONTENTSCRIPT_RELATIVE_PATH);
  let contentscriptSource: string;
  try {
    contentscriptSource = await readFile(contentScriptPath, 'utf8');
  } catch {
    throw new Error(
      `SourcemapValidator (webpack) - failed to read "${CONTENTSCRIPT_RELATIVE_PATH}" from dist/chrome. Cannot auto-detect source map location.`,
    );
  }

  return contentscriptSource
    .trimEnd()
    .endsWith(CONTENTSCRIPT_SOURCEMAP_REFERENCE)
    ? 'sibling'
    : 'sourcemaps';
}

/**
 * Entry point: discovers all webpack bundles in dist/chrome, validates each
 * bundle's source map, and exits with code 1 if any validation fails.
 *
 * @param options - Source map validation options.
 * @param options.mapLocation - Optional override for where map files are expected for each bundle.
 */
export async function main(
  options: SourceMapValidatorOptions = {},
): Promise<void> {
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
    return;
  }

  let mapLocation: MapLocation;
  if (options.mapLocation === undefined) {
    try {
      mapLocation = await detectMapLocationFromContentscript(chromeDir);
      console.log(
        `SourcemapValidator (webpack) - auto-detected map location "${mapLocation}" from "${CONTENTSCRIPT_RELATIVE_PATH}".`,
      );
    } catch (error) {
      console.error(error);
      process.exit(1);
      return;
    }
  } else {
    mapLocation = options.mapLocation;
  }

  const pairs = await discoverWebpackBundles({ mapLocation });
  if (pairs.length === 0) {
    const searchedLocation =
      mapLocation === 'sibling' ? 'dist/chrome/' : 'dist/sourcemaps/';
    console.error(
      `SourcemapValidator (webpack) - no .js+.map pairs found using map location "${mapLocation}" (${searchedLocation}). Run a webpack build first and ensure bundles and their .map files are present. Exiting with code 1.`,
    );
    process.exit(1);
    return;
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
    return;
  }

  console.log(
    `SourcemapValidator (webpack) - all ${pairs.length} bundle(s) validated successfully.`,
  );
}

/**
 * Recursively finds all .js files in dist/chrome that have a .map file in the
 * configured location.
 * Skips directories whose names start with '_' or equal 'vendor'.
 *
 * @param options - Source map discovery options.
 * @param options.mapLocation - Where map files are expected for each bundle.
 * @returns Sorted array of { jsPath, mapPath, label } for each bundle (label is path relative to dist/chrome).
 */
export async function discoverWebpackBundles(
  options: DiscoverWebpackBundlesOptions,
): Promise<FilePair[]> {
  const { mapLocation } = options;
  const distDir = join(process.cwd(), 'dist');
  const chromeDir = join(distDir, PLATFORM);
  const sourcemapsDir = join(distDir, SOURCEMAPS_DIRNAME);
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
        const relativeBundlePath = toPosixPath(relative(chromeDir, full));
        const mapPath =
          mapLocation === 'sourcemaps'
            ? join(sourcemapsDir, `${relativeBundlePath}.map`)
            : `${full}.map`;

        try {
          await access(mapPath);
          pairs.push({
            jsPath: full,
            mapPath,
            label: relativeBundlePath,
          });
        } catch {
          // no map for this bundle at the configured location
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
 * "new Error". Logs errors for missing source content or incorrect mapping.
 *
 * Positions with no source-map coverage are skipped — this is expected in
 * minified builds where template-literal newlines create lines with no
 * mappings, and where the SWC minifier + webpack source-map chaining produces
 * sparse coverage gaps for certain npm modules.
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

  let consumer: BasicSourceMapConsumer | IndexedSourceMapConsumer | null = null;
  try {
    consumer = await new SourceMapConsumer(rawSourceMap);
    if (!consumer.hasContentsOfAllSources()) {
      console.warn(
        'SourcemapValidator (webpack) - missing content of some sources...',
      );
    }

    console.log(`  sampling from ${consumer.sources.length} files`);
    let sampleCount = 0;
    let unmappedCount = 0;
    let valid = true;

    const buildLines = rawBuild.split('\n');
    for (let lineIndex = 0; lineIndex < buildLines.length; lineIndex++) {
      const line = buildLines[lineIndex];
      const matchIndices = indicesOf(TARGET_STRING, line);
      for (const matchColumn of matchIndices) {
        const position = { line: lineIndex + 1, column: matchColumn };
        const result = consumer.originalPositionFor(position);

        if (!result.source) {
          if (
            isLikelyCommentLine(line) ||
            isInsideMultilineBlockComment(buildLines, lineIndex)
          ) {
            continue;
          }
          // In minified builds, some positions legitimately have no source-map
          // coverage. This happens when:
          //  1. Template-literal strings contain real newlines, creating lines
          //     in the output with zero mappings (the minifier can't map string
          //     content back to "code" in the original source).
          //  2. The SWC minifier + webpack SourceMapSource chaining produces
          //     null-source segments at module boundaries, leaving gaps in
          //     coverage for certain npm module code.
          // These are toolchain limitations, not source-map corruption.
          // We skip these positions and report the count at the end.
          unmappedCount += 1;
          continue;
        }

        // We need original line/column to verify that "new Error" in the bundle maps to
        // "new Error" in the source. Some maps return source file but null line/column
        // (e.g. sparse mappings). For our purpose (reliable stack traces) that is
        // insufficient — treat it as a validation failure.
        if (result.line === null || result.column === null) {
          sampleCount += 1;
          valid = false;
          console.error(
            `SourcemapValidator (webpack) - mapping for "${label}" has source but no original line/column; precise position required for stack traces.`,
          );
          continue;
        }

        // Reject invalid positions: line is 1-based (must be >= 1), column is 0-based (must be >= 0).
        // Negative column would make sourceLine.slice(column) take from the end of the string (JS semantics),
        // which can cause a false positive if "new Error" appears in that wrong portion.
        if (result.line < 1 || result.column < 0) {
          sampleCount += 1;
          valid = false;
          console.error(
            `SourcemapValidator (webpack) - mapping for "${label}" has invalid original line/column (line: ${result.line}, column: ${result.column}); must be non-negative.`,
          );
          continue;
        }

        sampleCount += 1;

        const {
          line: origLine,
          column: origColumn,
          source: origSource,
        } = result;
        const sourceContent = consumer.sourceContentFor(origSource, true);
        if (sourceContent === null) {
          valid = false;
          console.error(
            `SourcemapValidator (webpack) - no source content for "${origSource}", in bundle "${label}"`,
          );
          continue;
        }

        const sourceLines = sourceContent.split('\n');
        const sourceLineIndex = origLine - 1;
        const sourceLine = sourceLines[sourceLineIndex];
        const column = origColumn;
        const portion = sourceLine ? sourceLine.slice(column) : '';
        const foundValidSource = portion.includes(TARGET_STRING);

        if (!foundValidSource) {
          valid = false;
          const location = {
            start: {
              line: origLine,
              column: column + 1,
            },
          };
          const codeSample = codeFrameColumns(sourceContent, location, {
            message: `expected to see ${JSON.stringify(TARGET_STRING)}`,
            highlightCode: true,
          });
          console.error(
            `Sourcemap seems invalid, ${origSource}\n${codeSample}`,
          );
        }
      }
    }

    console.log(`  checked ${sampleCount} samples`);
    if (unmappedCount > 0) {
      console.log(
        `  skipped ${unmappedCount} unmapped position(s) (minification coverage gaps)`,
      );
    }
    if (sampleCount === 0) {
      console.error(
        `SourcemapValidator (webpack) - no "${TARGET_STRING}" found in bundle "${label}"; nothing to validate.`,
      );
    }
    return valid;
  } catch (error) {
    console.error(
      `SourcemapValidator (webpack) - error validating bundle "${label}":`,
      error,
    );
    return false;
  } finally {
    consumer?.destroy();
  }
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

// Run when executed directly (e.g. tsx ./development/webpack/sourcemap-validator.ts)
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
