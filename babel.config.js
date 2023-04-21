module.exports = function (api) {
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    targets: {
      browsers: ['chrome >= 90', 'firefox >= 91'],
    },
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-env',
      '@babel/preset-react',
    ],
  };
};
