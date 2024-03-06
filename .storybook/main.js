const path = require('path');
const { ProvidePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
  core: {
    disableTelemetry: true,
  },
  features: {
    buildStoriesJson: true,
  },
  stories: [
    '../ui/**/*.stories.js',
    '../ui/**/*.stories.tsx',
    '../ui/**/*.stories.mdx',
    './*.stories.mdx',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-actions',
    '@storybook/addon-a11y',
    '@storybook/addon-knobs',
    './i18n-party-addon/register.js',
    'storybook-dark-mode',
    '@whitespace/storybook-addon-html',
    '@storybook/addon-mdx-gfm',
    '@storybook/addon-designs',
  ],
  staticDirs: ['../app', './images'],
  // Uses babel.config.js settings and prevents "Missing class properties transform" error
  babel: async (options) => ({
    overrides: options.overrides,
  }),
  webpackFinal: async (config) => {
    config.context = process.cwd();
    config.node = {
      __filename: true,
    };
    config.resolve.alias['webextension-polyfill'] = require.resolve(
      '../ui/__mocks__/webextension-polyfill.js',
    );
    config.resolve.fallback = {
      child_process: false,
      constants: false,
      crypto: false,
      fs: false,
      http: false,
      https: false,
      os: false,
      path: false,
      stream: require.resolve('stream-browserify'),
      zlib: false,
      _stream_transform: require.resolve(
        'readable-stream/lib/_stream_transform.js',
      ),
    };
    config.module.strictExportPresence = true;
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            import: false,
            url: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            implementation: require('sass-embedded'),
            sassOptions: {
              includePaths: ['ui/css/', 'node_modules/',],
            },
          },
        },
      ],
    });
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(
              'node_modules',
              '@fortawesome',
              'fontawesome-free',
              'webfonts',
            ),
            to: path.join('fonts', 'fontawesome'),
          },
        ],
      }),
    );
    config.plugins.push(
      new ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    );
    return config;
  },
  docs: {
    autodocs: true,
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
};
