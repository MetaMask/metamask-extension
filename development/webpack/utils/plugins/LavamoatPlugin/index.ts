import { join } from 'node:path';
import LavamoatPlugin from '@lavamoat/webpack';

export const lavamoatPlugin = new LavamoatPlugin({
  rootDir: join(__dirname, '../../../../../'), // While ../../../../../app is the main dir for the webpack build to use as context, the project root where package.json is one level up. This discrepancy needs to be explained to LavaMoat plugin as it's searching for the package.json in the compilator.context by default.
  diagnosticsVerbosity: 2,
  generatePolicy: true,
  runChecks: true, // Candidate to disable later for performance. useful in debugging invalid JS errors, but unless the audit proves me wrong this is probably not improving security.
  readableResourceIds: true,
  inlineLockdown: /^runtime|contentscript\.js/u,
  unlockedChunksUnsafe: /inpage\.js/u,
  debugRuntime: true,
  lockdown: {
    consoleTaming: 'unsafe',
    errorTaming: 'unsafe',
    stackFiltering: 'verbose',
    overrideTaming: 'severe',
    localeTaming: 'unsafe',
    errorTrapping: 'none',
  },
  scuttleGlobalThis: {
    enabled: true,
    // scuttlerName: 'SCUTTLER', // TODO(weizman) SUPPORT SNOW AND SCUTTLER
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
      'OffscreenCanvas', // Used by browser to generate notifications
      // globals chromedriver needs to function
      // @ts-expect-error - regex is not included in the types for some reason
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
      // webpack
      'webpackChunk',
    ],
  },
});
