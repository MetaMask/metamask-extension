import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import dotenv from 'dotenv';
import type { StorybookConfig } from '@storybook/react-webpack5';

const { ProvidePlugin } = webpack;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

dotenv.config({ path: path.resolve(__dirname, '../.metamaskrc') });

const config: StorybookConfig = {
  core: {
    disableTelemetry: true,
  },

  features: {
    buildStoriesJson: true,
  },

  stories: [
    '../ui/**/*.stories.js',
    '../ui/**/*.stories.tsx',
    // MDX stories temporarily disabled for v10 upgrade - need migration
    // '../ui/**/*.stories.mdx',
    // './*.stories.mdx',
  ],

  addons: [
    '@storybook/addon-a11y',
    // './i18n-party-addon/register.js', // Temporarily disabled for v10 upgrade
    '@storybook/addon-docs',
    '@storybook/addon-webpack5-compiler-swc',
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
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['webextension-polyfill'] = path.resolve(
      __dirname,
      '../ui/__mocks__/webextension-polyfill.js',
    );
    config.resolve.alias['../../../../store/actions'] = path.resolve(
      __dirname,
      '../ui/__mocks__/actions.js',
    );
    config.resolve.alias['../../../../../../store/actions'] = path.resolve(
      __dirname,
      '../ui/__mocks__/actions.js',
    );
    config.resolve.alias['../../../store/actions'] = path.resolve(
      __dirname,
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
    config.module = config.module || { rules: [] };
    config.module.strictExportPresence = true;
    config.module.rules = config.module.rules || [];
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
    config.plugins = config.plugins || [];
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

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  docs: {},

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
