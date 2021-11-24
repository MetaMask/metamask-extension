module.exports = function (api) {
  api.cache(false);
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: ['chrome >= 66', 'firefox >= 68'],
          },
        },
      ],
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
          development: process.env.NODE_ENV === 'development',
          importSource: '@welldone-software/why-did-you-render',
        },
      ],
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
    ],
  };
};
