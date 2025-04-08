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
        './development/build/transforms/import-meta-url.js',
        {
          patterns: [/dist\/preinstalled-snap\.json$/u],
          rootPathVar: './preinstalled-snaps/', // the directory you copy the JSON files to in the build process
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
