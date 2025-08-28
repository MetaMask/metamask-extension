const path = require('path');
const { ProvidePlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const LavaMoatPlugin = require('@lavamoat/webpack');

module.exports = {
  mode: 'development',
  entry: {
    app: './repro/app.js',
    bootstrap: {
      import: './repro/bootstrap.js',
      layer: 'bootstrap',
    },
  },
  devtool: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    splitChunks: {
      maxSize: 24,
      minSize: 1,
    },
    runtimeChunk: {
      name: (chunk) => {
        if(chunk.name === "bootstrap") return false;
        return "runtime";
      }
    },
  },
  plugins: [
    new LavaMoatPlugin({
      readableResourceIds: true,
      inlineLockdown: /^runtime\.js/u,
      rootDir: __dirname + '/../',
      diagnosticsVerbosity: 2,
      generatePolicy: true,
      runChecks: true, // Candidate to disable later for performance. useful in debugging invalid JS errors, but unless the audit proves me wrong this is probably not improving security.
      readableResourceIds: true,
      inlineLockdown: /^runtime\.js/u,
      debugRuntime: false,
      lockdown: {
        consoleTaming: 'unsafe',
        errorTaming: 'unsafe',
        stackFiltering: 'verbose',
        overrideTaming: 'severe',
        localeTaming: 'unsafe',
        errorTrapping: 'none',
        reporting: 'none',
      },
      scuttleGlobalThis: {
        enabled: true,
        // TODO(34913): support snow and scuttler
        // scuttlerName: 'SCUTTLER',
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
    }),
    new ProvidePlugin({
      process: 'process/browser.js',
    }),
    new CopyPlugin({
      patterns: [{ from: './repro/index.html', to: 'index.html' }],
    }),
  ],
  module: {
    rules: [
      {
        issuerLayer: 'bootstrap',
        use: LavaMoatPlugin.exclude,
      },
      {
        dependency: 'url',
        type: 'asset/resource',
      },
    ],
  },
  experiments: {
    layers: true,
  },
};
