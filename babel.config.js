const path = require('path');

module.exports = function (api) {
  api.cache(false);
  const slash = `\\${path.sep}`;
  const uiPath = path.join(__dirname, 'ui').replace(/\\/gu, '\\\\');
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      browsers: ['chrome >= 123', 'firefox >= 128'],
    },
    overrides: [
      {
        test: new RegExp(
          `^${uiPath}${slash}(?:components|contexts|hooks|layouts|pages)${slash}(?!.*\\.(?:test|stories|container)\\.)(?:.*)\\.(?:m?[jt]s|[jt]sx)$`,
          'u',
        ),
        plugins: [['babel-plugin-react-compiler', { target: '17' }]],
      },
    ],
    plugins: [
      // `browserify` is old and busted, and doesn't support `??=` (and other
      // logical assignment operators) or class features like private methods.
      // Keep these syntax transforms enabled even when our browser support floor
      // is high enough to run them natively.
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-class-static-block',
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
      '@babel/plugin-transform-logical-assignment-operators',
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
        'import-meta-url-snaps',
      ],
      [
        path.resolve(
          __dirname,
          'development/build/transforms/import-meta-url.js',
        ),
        {
          pattern: /^@rive-app\/canvas\/(rive)\.wasm$/u,
          rootPath: '/images/',
        },
        'import-meta-url-rive',
      ],
    ],
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
      '@babel/preset-react',
    ],
  };
};
