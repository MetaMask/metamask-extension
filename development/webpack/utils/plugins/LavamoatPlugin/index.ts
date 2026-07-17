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
  'appState',
  'extra',
  'stateHooks',
  'sentryHooks',
  'sentry',
  'logEncryptedVault',
  'WebAssembly',
  'Request',
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
  // v10 Sentry web-vitals (whenIdleOrHidden) feature-detects this;
  // under scuttling the detection itself throws unless excepted.
  'requestIdleCallback',
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
        return {
          mode: 'safe',
          embeddedOptions: {
            // Match the aliases provided by a real service worker global.
            globalAliases: ['self', 'globalThis'],
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

// Unsafe layer that runs code without LavaMoat.
export const lavamoatUnsafeLayerRule = {
  issuerLayer: 'unsafe',
  use: LavamoatExcludeLoader,
} satisfies RuleSetRule;

export const lavamoatUnsafeLayerPlugin: WebpackPluginInstance = {
  apply: (compiler) => {
    compiler.options.module.rules.push(lavamoatUnsafeLayerRule);
    compiler.hooks.thisCompilation.tap('Layer', (compilation) => {
      compilation.hooks.addEntry.tap('Layer', (entry, options) => {
        const { name } = options;
        if (name && 'request' in entry && typeof entry.request === 'string') {
          if (nullUnsafeEntries.has(name)) {
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
