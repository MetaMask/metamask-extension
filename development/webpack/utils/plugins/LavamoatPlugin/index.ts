import { join } from 'node:path';
import type { WebpackPluginInstance, RuleSetRule, Chunk } from 'webpack';
import {
  LavaMoatPlugin,
  exclude as LavamoatExcludeLoader,
} from '@lavamoat/webpack';
import type { Args } from '../../cli';

// While ../../../../../app is the main dir for the webpack build to use as context, the project root where package.json is one level up.
// This discrepancy needs to be explained to LavaMoat plugin as it's searching for the package.json in the compilator.context by default.
const rootDir = join(__dirname, '../../../../../');

// Entries that run fully outside LavaMoat and host no wrapped code, so their chunk gets no LavaMoat runtime at all.
const nullUnsafeEntries: Set<string> = new Set([
  'scripts/inpage.js',
  'bootstrap',
]);

const getScuttleGlobalThisExceptions = (args: Args) => [
  // globals used by different mm deps outside of lm compartment
  'window',
  'Proxy',
  'toString',
  'getComputedStyle',
  'addEventListener',
  'removeEventListener',
  'ShadowRoot',
  'HTMLElement',
  'HTMLFormElement',
  'Element',
  'pageXOffset',
  'pageYOffset',
  'visualViewport',
  'Reflect',
  'Set',
  'Object',
  'navigator',
  'harden',
  'console',
  'WeakSet',
  'Event',
  'EventTarget',
  // globals used by the browser to generate notifications
  'Image',
  'fetch',
  'AbortController',
  'OffscreenCanvas',
  /cdc_[a-zA-Z0-9]+_[a-zA-Z]+/iu,
  'name',
  'performance',
  'parseFloat',
  'innerWidth',
  'innerHeight',
  'Symbol',
  'Math',
  'DOMRect',
  'Number',
  'Array',
  'crypto',
  'Function',
  'Uint8Array',
  'String',
  'Promise',
  'JSON',
  'Date',
  // Selenium atoms construct regexes while locating elements.
  'RegExp',
  // globals sentry needs to function
  '__SENTRY__',
  'WebAssembly',
  'appState',
  'extra',
  'stateHooks',
  'sentryHooks',
  'sentry',
  'logEncryptedVault',
  // needed by Sentry and react-router-dom v6 HashRouter
  'history',
  // globals used by react-dom
  'getSelection',
  // globals opera needs to function
  'opr',
  // for @popperjs/core and snap simple keyring site
  'devicePixelRatio',
  // for @tanstack/react-virtual
  'ResizeObserver',
  'setTimeout',
  'clearTimeout',
  // globals used by e2e
  ...(args.test ? ['ret_nodes', 'browser', 'chrome', 'indexedDB'] : []),
];

export const lavamoatPlugin = (args: Args) =>
  new LavaMoatPlugin({
    rootDir,
    policyLocation: join(
      'lavamoat',
      'webpack',
      `mv${args.manifestVersion}`,
      args.type,
    ),
    diagnosticsVerbosity: 0,
    generatePolicyOnly: args.generatePolicy,
    runChecks: true, // Candidate to disable later for performance. useful in debugging invalid JS errors, but unless the audit proves me wrong this is probably not improving security.
    readableResourceIds: true,
    // we apply lockdown to 'runtime.<hash>.js', 'scripts/contentscript.js', and 'service-worker.js'.
    inlineLockdown:
      /^(?:runtime\.[0-9a-h]{20}\.js|scripts\/contentscript\.js|service-worker\.js)$/u,
    debugRuntime: args.lavamoatDebug,
    lockdown: {
      consoleTaming: 'unsafe',
      errorTaming: 'unsafe',
      stackFiltering: 'verbose',
      overrideTaming: 'severe',
      localeTaming: 'unsafe',
      errorTrapping: 'none',
      reporting: 'none',
    },
    runtimeConfigurationPerChunk_experimental: (chunk: Chunk) => {
      if (chunk.name && nullUnsafeEntries.has(chunk.name)) {
        // nullUnsafeEntries run fully outside of LavaMoat, no runtime added
        return { mode: 'null_unsafe' };
      } else if (chunk.name === 'service-worker.ts') {
        // The SW entry module and its static bootstrap imports are excluded
        // from wrapping (the 'unsafe' layer), but this chunk must run in 'safe'
        // mode so it carries the LavaMoat runtime. The imported `background` bundle
        // is wrapped and relies on it.
        return {
          mode: 'safe',
          embeddedOptions: {
            scuttleGlobalThis: {
              enabled: true,
              // Globals used by the service worker
              exceptions: [
                ...getScuttleGlobalThisExceptions(args),
                'importScripts',
              ],
            },
          },
        };
      } else if (chunk.name === 'scripts/contentscript.js') {
        return {
          mode: 'safe',
          embeddedOptions: {
            scuttleGlobalThis: {
              enabled: true,
              // Globals used by the contentscript
              exceptions: ['browser', 'chrome', 'btoa'],
            },
          },
        };
      } else if (chunk.name === 'runtime') {
        return {
          mode: 'safe',
          // If snow is enabled, it needs to run before LavaMoat
          staticShims: args.snow
            ? [
                require.resolve('@lavamoat/snow/snow.prod.js'),
                join(rootDir, 'app/scripts/use-snow.js'),
              ]
            : [],
        };
      }
      return { mode: 'safe' };
    },
    scuttleGlobalThis: {
      enabled: true,
      // Scuttler depends on Snow
      scuttlerName: args.snow ? 'SCUTTLER' : undefined,
      exceptions: getScuttleGlobalThisExceptions(args),
    },
  });

// Matches the app's `background` root module, which the service worker imports.
// This is the boundary at which the 'unsafe' layer must stop, so that `background`
// and its entire dependency graph run inside LavaMoat.
const backgroundEntryRe = /[\\/]app[\\/]scripts[\\/]background\.js$/u;

// Unsafe layer that runs code without LavaMoat. `background` is excluded here
// because, although it is imported from the unsafe service worker, it must
// itself be wrapped; `lavamoatBackgroundLayerRule` re-layers it (and its graph)
// so it escapes this exclusion.
export const lavamoatUnsafeLayerRule = {
  issuerLayer: 'unsafe',
  exclude: backgroundEntryRe,
  use: LavamoatExcludeLoader,
} satisfies RuleSetRule;

// Moves `background` out of the 'unsafe' layer so LavaMoat wraps it.
// Without this, the import from the unsafe service worker would drag
// the whole background graph into the 'unsafe' layer and leave it unprotected.
export const lavamoatBackgroundLayerRule = {
  test: backgroundEntryRe,
  issuerLayer: 'unsafe',
  layer: 'background',
} satisfies RuleSetRule;

// Entries assigned to the 'unsafe' layer so they are excluded from Compartment wrapping.
const unsafeLayerEntries: Set<string> = new Set([
  'scripts/inpage.js',
  'bootstrap',
  'service-worker.ts',
]);

export const lavamoatUnsafeLayerPlugin: WebpackPluginInstance = {
  apply: (compiler) => {
    compiler.options.module.rules.push(
      lavamoatUnsafeLayerRule,
      lavamoatBackgroundLayerRule,
    );
    compiler.hooks.thisCompilation.tap('Layer', (compilation) => {
      compilation.hooks.addEntry.tap('Layer', (entry, options) => {
        const { name } = options;
        if (name && 'request' in entry && typeof entry.request === 'string') {
          if (unsafeLayerEntries.has(name)) {
            const entryData = compilation.entries.get(name);
            if (entryData) {
              entryData.options.layer = lavamoatUnsafeLayerRule.issuerLayer;
            }
          }
        }
      });
    });
  },
};
