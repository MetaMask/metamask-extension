const path = require('path');
const { ProvidePlugin, NormalModuleReplacementPlugin } = require('webpack');
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
    '../ui/**/*.mdx',
    './*.mdx',
  ],

  typescript: {
    // Disable react-docgen to avoid TS/JSX parse errors from legacy stories
    reactDocgen: false,
  },

  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],

  managerEntries: [path.resolve(__dirname, './i18n-party-addon/register.js')],

  staticDirs: ['../app', './images'],

  env: (config) => ({
    ...config,
    INFURA_PROJECT_ID: process.env.INFURA_STORYBOOK_PROJECT_ID || '',
  }),

  // Uses babel.config.js settings and prevents "Missing class properties transform" error
  babel: async (options) => ({
    // Preserve Storybook defaults (presets/plugins) while allowing project overrides.
    ...options,
    overrides: options.overrides,
  }),

  webpackFinal: async (config) => {
    config.context = process.cwd();
    config.node = {
      __filename: true,
    };
    config.resolve.alias['react$'] = path.resolve(
      __dirname,
      './react-compat.js',
    );
    config.resolve.alias['@storybook/addon-docs'] = path.resolve(
      __dirname,
      './addon-docs-compat.js',
    );
    config.resolve.alias['@storybook/addon-docs/blocks'] = path.resolve(
      __dirname,
      './addon-docs-compat.js',
    );
    config.resolve.alias['@storybook/addon-docs/blocks$'] = path.resolve(
      __dirname,
      './addon-docs-compat.js',
    );
    config.resolve.alias['@storybook/blocks'] = path.resolve(
      __dirname,
      './addon-docs-compat.js',
    );
    config.resolve.alias['storybook/internal/theming'] =
      require.resolve('@storybook/theming');
    config.resolve.alias['react/jsx-runtime'] =
      require.resolve('react/jsx-runtime');
    config.resolve.alias['react/jsx-dev-runtime'] = require.resolve(
      'react/jsx-dev-runtime',
    );
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
    config.module.rules.unshift({
      // Pre-transpile JS/TS with Babel using project config before CSF/export-order loaders run.
      test: /\.(mjs|tsx?|jsx?)$/,
      exclude: /node_modules/,
      enforce: 'pre',
      use: [
        {
          loader: path.resolve(__dirname, './babel-inline-loader.js'),
        },
      ],
    });
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
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: ['tailwindcss', 'autoprefixer'],
            },
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
    config.plugins.push(
      new NormalModuleReplacementPlugin(
        /@storybook\/addon-docs\/blocks/,
        path.resolve(__dirname, './addon-docs-compat.js'),
      ),
    );
    return config;
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
