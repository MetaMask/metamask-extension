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
      // This plugin enables support for logical assignment operators in browsers
      // that may not support them natively.
      '@babel/plugin-transform-logical-assignment-operators',
    ],
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          // By default, @babel/preset-env does not include any polyfills or
          // transformations for logical assignment operators.
          // If you need to support older browsers that do not support these
          // operators, you may need to include additional plugins or polyfills.
          // However, modern browsers like Chrome >= 89 and Firefox >= 89
          // should support them natively.
          useBuiltIns: 'usage',
          corejs: '3.0.0', // Specify the version of core-js to use
        },
      ],
      '@babel/preset-react',
    ],
  };
};
