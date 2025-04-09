const path = require('path');

module.exports = function (api) {
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      browsers: ['chrome >= 89', 'firefox >= 89'],
    },
    plugins: [
      // `browserify` is old and busted, and doesn't support `??=` (and other
      // logical assignment operators). This plugin lets us target es2020-level
      // browsers (except we do still end up with transpiled logical assignment
      // operators 😭)
      '@babel/plugin-transform-logical-assignment-operators',
      [
        path.resolve(
          __dirname,
          'development/build/transforms/import-meta-url.js',
        ),
        {
          pattern: /^@metamask\/([^/]+)\/dist\/preinstalled-snap\.json$/u,
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
