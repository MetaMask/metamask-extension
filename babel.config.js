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
    ],
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
      '@babel/preset-react',
    ],
  };
};
