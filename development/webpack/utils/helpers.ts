import { readdirSync } from 'node:fs';
import { parse, join, relative, sep } from 'node:path';
import type { Chunk, EntryObject, Stats } from 'webpack';
import type TerserPluginType from 'terser-webpack-plugin';

export type Manifest = chrome.runtime.Manifest;
export type ManifestV2 = chrome.runtime.ManifestV2;
export type ManifestV3 = chrome.runtime.ManifestV3;

// HMR (Hot Module Reloading) can't be used until all circular dependencies in
// the codebase are removed
// See: https://github.com/MetaMask/metamask-extension/issues/22450
// TODO: remove this variable when HMR is ready. The env var is for tests and
// must also be removed everywhere.
export const __HMR_READY__ = Boolean(process.env.__HMR_READY__) || false;

/**
 * Target browsers
 */
export const Browsers = ['brave', 'chrome', 'firefox'] as const;
export type Browser = (typeof Browsers)[number];

const slash = `(?:\\${sep})?`;
/**
 * Regular expression to match files in any `node_modules` directory
 * Uses a platform-specific path separator: `/` on Unix-like systems and `\` on
 * Windows.
 */
export const NODE_MODULES_RE = new RegExp(`${slash}node_modules${slash}`, 'u');

/**
 * No Operation. A function that does nothing and returns nothing.
 *
 * @returns `undefined`
 */
export const noop = () => undefined;

/**
 * Collects all entry files for use with webpack.
 *
 * TODO: move this logic into the ManifestPlugin
 *
 * @param manifest - Base manifest file
 * @param appRoot - Absolute directory to search for entry files listed in the
 * base manifest
 * @returns an `entry` object containing html and JS entry points for use with
 * webpack, and an array, `manifestScripts`, list of filepaths of all scripts
 * that were added to it.
 */
export function collectEntries(manifest: Manifest, appRoot: string) {
  const entry: EntryObject = {};
  /**
   * Scripts that must be self-contained and not split into chunks.
   */
  const selfContainedScripts: Set<string> = new Set([
    // Snow shouldn't be chunked
    'snow.prod',
    'use-snow',
  ]);

  function addManifestScript(filename?: string) {
    if (filename) {
      selfContainedScripts.add(filename);
      entry[filename] = {
        chunkLoading: false,
        filename, // output filename
        import: join(appRoot, filename), // the path to the file to use as an entry
      };
    }
  }

  function addHtml(filename?: string) {
    if (filename) {
      assertValidEntryFileName(filename, appRoot);
      entry[parse(filename).name] = join(appRoot, filename);
    }
  }

  // add content_scripts to entries
  manifest.content_scripts?.forEach((s) => s.js?.forEach(addManifestScript));

  if (manifest.manifest_version === 3) {
    addManifestScript(manifest.background?.service_worker);
    manifest.web_accessible_resources?.forEach(({ resources }) =>
      resources.forEach((filename) => {
        filename.endsWith('.js') && addManifestScript(filename);
      }),
    );
  } else {
    manifest.web_accessible_resources?.forEach((filename) => {
      filename.endsWith('.js') && addManifestScript(filename);
    });
    manifest.background?.scripts?.forEach(addManifestScript);
    addHtml(manifest.background?.page);
  }

  for (const filename of readdirSync(appRoot)) {
    // ignore non-htm/html files
    if (/\.html?$/iu.test(filename)) {
      addHtml(filename);
    }
  }

  /**
   * Ignore scripts that were found in the manifest, as these are only loaded by
   * the browser extension platform itself.
   *
   * @param chunk
   * @param chunk.name
   * @returns
   */
  function canBeChunked({ name }: Chunk): boolean {
    return !name || !selfContainedScripts.has(name);
  }
  return { entry, canBeChunked };
}

/**
 * @param filename
 * @param appRoot
 * @throws Throws an `Error` if the file is an invalid entrypoint filename
 * (a file starting with "_")
 */
function assertValidEntryFileName(filename: string, appRoot: string) {
  if (!filename.startsWith('_')) {
    return;
  }

  const relativeFile = relative(process.cwd(), join(appRoot, filename));
  const error = `Invalid Entrypoint Filename Detected\nPath: ${relativeFile}`;
  const reason = `Filenames at the root of the extension directory starting with "_" are reserved for use by the browser.`;
  const newFile = filename.slice(1);
  const solutions = [
    `Rename this file to remove the underscore, e.g., '${filename}' to '${newFile}'`,
    `Move this file to a subdirectory and, if necessary, add it manually to the build 😱`,
  ];
  const context = `This file was included in the build automatically by our build script, which adds all HTML files at the root of '${appRoot}'.`;

  const message = `${error}
  Reason: ${reason}

  Suggested Actions:
  ${solutions.map((solution) => ` •  ${solution}`).join('\n')}
  ${`\n ${context}`}
  `;

  throw new Error(message);
}

/**
 * It gets minimizers for the webpack build.
 */
export function getMinimizers() {
  const TerserPlugin: typeof TerserPluginType = require('terser-webpack-plugin');
  return [
    new TerserPlugin({
      // use SWC to minify (about 7x faster than Terser)
      minify: TerserPlugin.swcMinify,
      // do not minify snow.
      exclude: /snow\.prod/u,
    }),
  ];
}

/**
 * Helpers for logging to the console with color.
 */
export const { colors, toGreen, toOrange, toPurple } = ((depth, esc) => {
  if (depth === 1) {
    const echo = (message: string): string => message;
    return { colors: false, toGreen: echo, toOrange: echo, toPurple: echo };
  }
  // 24: metamask green, 8: close to metamask green, 4: green
  const green = { 24: '38;2;186;242;74', 8: '38;5;191', 4: '33' }[depth];
  // 24: metamask orange, 8: close to metamask orange, 4: red :-(
  const orange = { 24: '38;2;247;85;25', 8: '38;5;208', 4: '31' }[depth];
  // 24: metamask purple, 8: close to metamask purple, 4: purple
  const purple = { 24: '38;2;208;117;255', 8: '38;5;177', 4: '35' }[depth];
  return {
    colors: { green: `${esc}[1;${green}m`, orange: `${esc}[1;${orange}m` },
    toGreen: (message: string) => `${esc}[1;${green}m${message}${esc}[0m`,
    toOrange: (message: string) => `${esc}[1;${orange}m${message}${esc}[0m`,
    toPurple: (message: string) => `${esc}[1;${purple}m${message}${esc}[0m`,
  };
})((process.stderr.getColorDepth?.() as 1 | 4 | 8 | 24) || 1, '\u001b');

/**
 * Logs a summary of build information to `process.stderr` (webpack logs to
 * stderr).
 *
 * Note: `err` and stats.hasErrors() are different. `err` prevents compilation
 * from starting, while `stats.hasErrors()` is true if there were errors during
 * compilation itself.
 *
 * @param err - If not `undefined`, logs the error to `process.stderr`.
 * @param stats - If not `undefined`, logs the stats to `process.stderr`.
 */
export function logStats(err?: Error | null, stats?: Stats) {
  if (err) {
    console.error(err);
    return;
  }

  if (!stats || !stats.compilation) {
    // technically this shouldn't happen, but webpack's TypeScript interface
    // doesn't enforce that `err` and `stats` are mutually exclusive.
    return;
  }
console.log('comp', stats.compilation)
  const { options } = stats.compilation;
  // orange for production builds, purple for development
  const colorFn = options.mode === 'production' ? toOrange : toPurple;
  stats.compilation.name = colorFn(`🦊 ${stats.compilation.compiler.name}`);
  if (options.stats === 'normal') {
    // log everything (computing stats is slow, so we only do it if asked).
    console.error(stats.toString({ colors }));
  } else if (stats.hasErrors() || stats.hasWarnings()) {
    // always log errors and warnings, if we have them.
    console.error(stats.toString({ colors, preset: 'errors-warnings' }));
  } else {
    // otherwise, just log a simple update
    const { name } = stats.compilation;
    const status = toGreen('successfully');
    const time = `${stats.endTime - stats.startTime} ms`;
    const { version } = require('webpack');
    console.error(`${name} (webpack ${version}) compiled ${status} in ${time}`);
  }
}

/**
 * @param array
 * @returns a new array with duplicate values removed and sorted
 */
export const uniqueSort = (array: string[]) => [...new Set(array)].sort();
