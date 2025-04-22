const path = require('path');
const { ProvidePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.metamaskrc') });

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
  env: (config) => ({
    ...config,
    INFURA_PROJECT_ID: process.env.INFURA_STORYBOOK_PROJECT_ID || '',
  }),
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
    config.resolve.alias['../../../../store/actions'] = require.resolve(
      '../ui/__mocks__/actions.js',
    );
    config.resolve.alias['../../../../../../store/actions'] = require.resolve(
      '../ui/__mocks__/actions.js',
    );
    config.resolve.alias['../../../store/actions'] = require.resolve(
      '../ui/__mocks__/actions.js',
    );
    // Import within controller-utils crashes storybook.
    config.resolve.alias['@ethereumjs/util'] = require.resolve(
      '../ui/__mocks__/ethereumjs-util.js',
    );
    config.resolve.alias['./useNftCollectionsMetadata'] = require.resolve(
      '../ui/__mocks__/useNftCollectionsMetadata.js',
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
            esModule: false,
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
              includePaths: ['ui/css/', 'node_modules/'],
            },
          },
        },
      ],
    });
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join('ui', 'css', 'utilities', 'fonts/'),
            to: 'fonts',
          },
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
