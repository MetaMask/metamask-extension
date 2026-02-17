import { join, sep } from 'node:path';
import type { EntryObject, Stats } from 'webpack';
import type TerserPluginType from 'terser-webpack-plugin';

export type Manifest = chrome.runtime.Manifest;
export type ManifestV2 = chrome.runtime.ManifestV2;
export type ManifestV3 = chrome.runtime.ManifestV3;
export type EntryDescription = Exclude<EntryObject[string], string | string[]>;

// HMR (Hot Module Reloading) can't be used until all circular dependencies in
// the codebase are removed
// See: https://github.com/MetaMask/metamask-extension/issues/22450
// TODO: remove this variable when HMR is ready. The env var is for tests and
// must also be removed everywhere.
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __HMR_READY__ = Boolean(process.env.__HMR_READY__) || false;

/**
 * Target browsers
 */
export const Browsers = ['chrome', 'firefox'] as const;
export type Browser = (typeof Browsers)[number];

const slash = `\\${sep}`;
/**
 * Regular expression to match files in any `node_modules` directory
 * Uses a platform-specific path separator: `/` on Unix-like systems and `\` on
 * Windows.
 */
export const NODE_MODULES_RE = new RegExp(
  `^.*${slash}node_modules${slash}.*$`,
  'u',
);

/**
 * Regular expression to match files in the `@lavamoat/snow` node_modules
 * directory.
 */
export const SNOW_MODULE_RE = new RegExp(
  `^.*${slash}node_modules${slash}@lavamoat${slash}snow${slash}.*$`,
  'u',
);

/**
 * Regular expression to match files in the `@trezor` node_modules directory.
 * This is used to match Trezor libraries that are CJS modules and need to be
 * processed with the CJS loader.
 */
export const TREZOR_MODULE_RE = new RegExp(
  `^.*${slash}node_modules${slash}@trezor${slash}.*$`,
  'u',
);

/**
 * Regular expression to match React files in the top-level `ui/` directory
 * Uses a platform-specific path separator: `/` on Unix-like systems and `\` on
 * Windows.
 */
export const UI_DIR_RE = new RegExp(
  `^${join(__dirname, '..', '..', '..', 'ui').replaceAll(sep, slash)}${slash}(?:components|contexts|hooks|layouts|pages)${slash}.*$`,
  'u',
);

/**
 * No Operation. A function that does nothing and returns nothing.
 *
 * @returns `undefined`
 */
export const noop = () => undefined;

/**
 * @param filename
 * @returns filename with .js extension (.ts | .tsx | .mjs -> .js)
 */
export const extensionToJs = (filename: string) =>
  filename.replace(/\.(ts|tsx|mjs)$/u, '.js');

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

  if (!stats) {
    // technically this shouldn't happen, but webpack's TypeScript interface
    // doesn't enforce that `err` and `stats` are mutually exclusive.
    return;
  }

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
