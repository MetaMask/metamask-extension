import { join } from 'node:path';
import type { WebpackPluginInstance, RuleSetRule, Chunk } from 'webpack';
import LavamoatPlugin, {
  exclude as LavamoatExcludeLoader,
  // @ts-expect-error - types are broken due to git install
} from '@lavamoat/webpack';
import type { Args } from '../../cli';

// While ../../../../../app is the main dir for the webpack build to use as context, the project root where package.json is one level up.
// This discrepancy needs to be explained to LavaMoat plugin as it's searching for the package.json in the compilator.context by default.
const rootDir = join(__dirname, '../../../../../');

// Entries that need to be included in the unsafe layer to run without LavaMoat.
const unsafeEntries: Set<string> = new Set(['scripts/inpage.js', 'bootstrap']);

export const lavamoatPlugin = (args: Args) =>
  new LavamoatPlugin({
    rootDir,
    diagnosticsVerbosity: 0,
    generatePolicyOnly: args.generatePolicy,
    runChecks: true, // Candidate to disable later for performance. useful in debugging invalid JS errors, but unless the audit proves me wrong this is probably not improving security.
    readableResourceIds: true,
    inlineLockdown: /^runtime|contentscript\.js/u,
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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    runtimeConfigurationPerChunk_experimental: (chunk: Chunk) => {
      if (chunk.name && unsafeEntries.has(chunk.name)) {
        // unsafeEntries are running outside of LavaMoat
        return { mode: 'null_unsafe' };
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
      exceptions: [
        // globals used by different mm deps outside of lm compartment
        'Proxy',
        'toString',
        'getComputedStyle',
        'addEventListener',
        'removeEventListener',
        'ShadowRoot',
        'HTMLElement',
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
        'Image', // Used by browser to generate notifications
        'fetch', // Used by browser to generate notifications
        'AbortController',
        'OffscreenCanvas', // Used by browser to generate notifications
        // globals chromedriver needs to function
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
        'setTimeout',
        'clearTimeout',
        'ret_nodes',
        // globals sentry needs to function
        '__SENTRY__',
        'appState',
        'extra',
        'stateHooks',
        'sentryHooks',
        'sentry',
        // e2e
        'HTMLFormElement',
        'getSelection',
        'EventTarget',
        'browser',
        'chrome',
        'indexedDB',
      ],
    },
  });

// Unsafe layer that runs code without LavaMoat
export const lavamoatUnsafeLayerRule = {
  issuerLayer: 'unsafe',
  use: LavamoatExcludeLoader,
} satisfies RuleSetRule;

// Unsafe layer plugin that applies the layer and assigns the unsafeEntries to it
export const lavamoatUnsafeLayerPlugin: WebpackPluginInstance = {
  apply: (compiler) => {
    compiler.options.experiments.layers = true;
    compiler.options.module.rules.push(lavamoatUnsafeLayerRule);
    compiler.hooks.thisCompilation.tap('Layer', (compilation) => {
      compilation.hooks.addEntry.tap('Layer', (entry, options) => {
        const { name } = options;
        if (name && 'request' in entry && typeof entry.request === 'string') {
          if (unsafeEntries.has(name)) {
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
