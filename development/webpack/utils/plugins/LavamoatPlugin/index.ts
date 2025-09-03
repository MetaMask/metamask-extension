import { join } from 'node:path';
import LavamoatPlugin from '../../../../../../LavaMoat/packages/webpack/src/plugin.js';
import type { Args } from '../../cli';

export const lavamoatPlugin = (args: Args) =>
  new LavamoatPlugin({
    rootDir: join(__dirname, '../../../../../'), // While ../../../../../app is the main dir for the webpack build to use as context, the project root where package.json is one level up. This discrepancy needs to be explained to LavaMoat plugin as it's searching for the package.json in the compilator.context by default.
    diagnosticsVerbosity: 0,
    generatePolicyOnly: args.generatePolicy,
    runChecks: true, // Candidate to disable later for performance. useful in debugging invalid JS errors, but unless the audit proves me wrong this is probably not improving security.
    readableResourceIds: true,
    inlineLockdown: /^runtime|contentscript\.js/u,
    debugRuntime: args.lavamoat === 'debug',
    lockdown: {
      consoleTaming: 'unsafe',
      errorTaming: 'unsafe',
      stackFiltering: 'verbose',
      overrideTaming: 'severe',
      localeTaming: 'unsafe',
      errorTrapping: 'none',
      reporting: 'none',
    },
    // Snow needs to run outside of LavaMoat
    // eslint-disable-next-line @typescript-eslint/naming-convention
    runtimeConfigurationPerChunk_experimental: (chunk) => {
      switch (chunk.name) {
        case 'scripts/contentscript.js':
          return {
            mode: 'safe',
            embeddedOptions: {
              scuttleGlobalThis: {
                enabled: true,
              },
            },
          };
        case 'scripts/inpage.js':
          return { mode: 'unlocked_unsafe' };
        case 'runtime':
          return {
            mode: 'safe',
            staticShims: args.snow
              ? [
                  join(
                    __dirname,
                    '../../../../../node_modules/@lavamoat/snow/snow.prod.js',
                  ),
                  join(__dirname, '../../../../../app/scripts/use-snow.js'),
                ]
              : [],
          };
        default:
          return { mode: 'safe' };
      }
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
