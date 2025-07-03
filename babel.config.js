const path = require('path');

module.exports = function (api) {
  api.cache(false);

  // Determine build environment to conditionally apply certain optimizations
  const isProduction = api.env('production') || process.env.NODE_ENV === 'production';

  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      browsers: ['chrome >= 89', 'firefox >= 89'],
    },
    plugins: [
      // Optimise lodash imports by cherry-picking only the modules that are
      // actually used. This dramatically reduces bundle size because the full
      // lodash package (~70 KB min+gz) is no longer pulled into every bundle
      // that references it.
      'lodash',

      // `browserify` is old and busted, and doesn't support `??=` (and other
      // logical assignment operators). This plugin lets us target es2020-level
      // browsers (except we do still end up with transpiled logical assignment
      // operators 😭)
      '@babel/plugin-transform-logical-assignment-operators',

      // Remove React prop-types in production builds to save ~3–4 KB per
      // component file and avoid runtime checks that we don't need in user
      // environments.
      ...(isProduction
        ? [
            [
              'transform-react-remove-prop-types',
              {
                removeImport: true,
              },
            ],
          ]
        : []),

      [
        path.resolve(
          __dirname,
          'development/build/transforms/import-meta-url.js',
        ),
        {
          pattern:
            /^@metamask\/([^/]+)\/dist\/preinstalled-snap\.json(\.gz)?$/u,
          rootPath: '/snaps/',
        },
      ],
    ],
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
      '@babel/preset-react',
    ],
  };
};
