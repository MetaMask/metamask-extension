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
          `^${uiPath}${slash}(?:components|contexts|hooks|layouts|pages)${slash}(?!.*(?:\\.(?:test|spec|stories|container)\\.|__mocks__${slash}|\\.d\\.[jt]s$)).*\\.(?:m?[jt]s|[jt]sx)$`,
          'u',
        ),
        plugins: [['babel-plugin-react-compiler', { target: '18' }]],
      },
    ],
    plugins: [
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
