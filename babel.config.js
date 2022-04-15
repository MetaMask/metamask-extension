module.exports = function (api) {
  api.cache(false);
  return {
    parserOpts: {
      strictMode: true,
    },
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: ['chrome >= 66', 'firefox >= 68'],
          },
        },
      ],
      '@babel/preset-react',
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['./'],
          alias: {
            '@components': './ui/components/app',
            '@ui': './ui/components/ui',
            '@helpers': './ui/helpers',
            '@hooks': './ui/hooks',
            '@store': './ui/store',
            '@contexts': './ui/contexts',
            '@selectors': './ui/selectors',
            '@ducks': './ui/ducks',
            '@shared': './shared',
          },
        },
      ],
    ],
  };
};
