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
  stories: ['../ui/**/*.stories.js', '../ui/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-webpack5-compiler-babel',
    './i18n-party-addon/register.js',
  ],
  staticDirs: ['../app', './images'],
  env: (config) => ({
    ...config,
    INFURA_PROJECT_ID: process.env.INFURA_STORYBOOK_PROJECT_ID || '',
  }),
  // Uses babel.config.js settings and prevents "Missing class properties transform" error
  // But excludes React Compiler to avoid React 17/18 compatibility issues
  babel: async (options) => {
    // Filter out babel-plugin-react-compiler from all configs
    const removeReactCompiler = (config) => {
      if (config.plugins) {
        config.plugins = config.plugins.filter(plugin => {
          const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
          return !pluginName.includes('babel-plugin-react-compiler');
        });
      }
      if (config.overrides) {
        config.overrides = config.overrides.map(override => ({
          ...override,
          plugins: override.plugins?.filter(plugin => {
            const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
            return !pluginName.includes('babel-plugin-react-compiler');
          }),
        }));
      }
      return config;
    };

    return removeReactCompiler({
      ...options,
      overrides: options.overrides,
    });
  },
  webpackFinal: async (config) => {
    config.context = process.cwd();
    config.node = {
      __filename: true,
    };

    // Force React 17 compatible shim for Storybook 8
    config.resolve.alias['@storybook/react-dom-shim'] = require.resolve(
      '@storybook/react-dom-shim/dist/react-16',
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
    return config;
  },
  docs: {
    autodocs: 'tag',
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      legacyRootApi: true,
    },
  },
  typescript: {
    reactDocgen: false,
    check: false,
  },
};
