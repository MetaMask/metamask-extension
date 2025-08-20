/**
 * @file The webpack configuration file to enable debug previewing for UI integration tests.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type Configuration,
  type WebpackPluginInstance,
  ProgressPlugin,
} from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import rtlCss from 'postcss-rtlcss';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

const context = join(__dirname, '../../app');
const browsersListPath = join(context, '../.browserslistrc');
const browsersListQuery = readFileSync(browsersListPath, 'utf8');

const plugins: WebpackPluginInstance[] = [
  new CopyPlugin({
    patterns: [
      { from: join(context, '_locales'), to: '_locales' }, // translations
      // misc images
      // TODO: fix overlap between this folder and automatically bundled assets
      { from: join(context, 'images'), to: 'images' },
    ],
  }),
  new ProgressPlugin(),
  new MiniCssExtractPlugin({ filename: '[name].css' }),
];

const config = {
  entry: {
    index: join(context, '../ui/css/index.scss'),
  },
  plugins,
  mode: 'development',
  context,
  stats: 'normal',
  name: `MetaMask UI integration test`,
  output: {
    path: join(context, '..', 'test/integration/config/assets'),
    clean: true,
  },
  // note: loaders in a `use` array are applied in *reverse* order, i.e., bottom
  // to top, (or right to left depending on the current formatting of the file)
  module: {
    rules: [
      // css, sass/scss
      {
        test: /\.(css|sass|scss)$/u,
        use: [
          MiniCssExtractPlugin.loader,
          // Resolves CSS `@import` and `url()` paths and loads the files.
          {
            loader: 'css-loader',
            options: {
              url: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  tailwindcss(),
                  autoprefixer({ overrideBrowserslist: browsersListQuery }),
                  rtlCss({ processEnv: false }),
                ],
              },
            },
          },
          {
            loader: 'resolve-url-loader',
          },
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              // Use 'sass-embedded', as it is usually faster than 'sass'
              implementation: 'sass-embedded',
              sassOptions: {
                api: 'modern',
                // We don't need to specify the charset because the HTML
                // already does and browsers use the HTML's charset for CSS.
                // Additionally, webpack + sass can cause problems with the
                // charset placement, as described here:
                // https://github.com/webpack-contrib/css-loader/issues/1212
                charset: false,
                // Always compress for integration tests to avoid ENOBUFS errors
                outputStyle: 'compressed',
                // The order of includePaths is important; prefer our own
                // folders over `node_modules`
                includePaths: [
                  // enables aliases to `@use design - system`,
                  // `@use utilities`, etc.
                  join(context, '../ui/css'),
                  join(context, '../node_modules'),
                ],
                // Disable the webpackImporter, as we:
                //  a) don't want to rely on it in case we want to switch away
                //     from webpack in the future
                //  b) the sass importer is faster
                //  c) the "modern" sass api doesn't work with the
                //     webpackImporter yet.
                webpackImporter: false,
              },
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
} as const satisfies Configuration;

export default config;
