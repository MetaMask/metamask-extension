import type { Configuration } from 'webpack-dev-server';
import { getDevServerClientUrl } from './helpers';

export const MODES = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
} as const;

/**
 * Entry name for the webpack-dev-server client bundle. Used by
 * `DEV_SERVER_OPTIONS.setupMiddlewares` to register the entry, by
 * `ManifestPlugin` to mark it self-contained, and by
 * `HtmlBundlerPlugin.beforeEmit` to look up its output filename for `<script>` injection.
 */
export const DEV_SERVER_CLIENT_ENTRY_NAME = 'dev-server-client';

export const DEV_SERVER_OPTIONS: Configuration = {
  hot: false,
  liveReload: true,
  // The built-in webpack-dev-server handler force-exits on a second Ctrl+C,
  // which can interrupt webpack's persistent cache shutdown.
  setupExitSignals: false,
  // always use loopback, as 0.0.0.0 tends to fail on some machines (WSL2?)
  host: 'localhost',
  // pick a free port at startup.
  port: 'auto',
  // client injection is disabled because the client is registered
  // as a webpack entry by `setupMiddlewares` below
  // and injected into UI pages by `HtmlBundlerPlugin`'s `beforeEmit` hook.
  client: false,
  devMiddleware: {
    // browsers need actual files on disk; extension pages are loaded via
    // `chrome-extension://`, not from the dev-server HTTP origin.
    writeToDisk: true,
  },
  // we don't need/have a "static" directory, so disable it
  static: false,
  allowedHosts: 'all',
  // Register the webpack-dev-server client here so that we can read the resolved port
  // from `devServer.options` — by this point `port: 'auto'` has been replaced
  // with the actual numeric port the server is listening on.
  setupMiddlewares: (middlewares, devServer) => {
    const compilers =
      'compilers' in devServer.compiler
        ? devServer.compiler.compilers
        : [devServer.compiler];
    for (const compiler of compilers) {
      new compiler.webpack.EntryPlugin(
        compiler.context,
        getDevServerClientUrl(devServer.options),
        { name: DEV_SERVER_CLIENT_ENTRY_NAME, chunkLoading: false },
      ).apply(compiler);
    }
    return middlewares;
  },
};

/**
 * The build environment. This describes the environment this build was produced in.
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  OTHER: 'other',
  PRODUCTION: 'production',
  PULL_REQUEST: 'pull-request',
  RELEASE_CANDIDATE: 'release-candidate',
  STAGING: 'staging',
  TESTING: 'testing',
} as const;

// Manifest key used for non-production Chrome builds to keep a stable
// extension ID for OAuth flows.
export const CHROME_MANIFEST_KEY_NON_PRODUCTION =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqZDxqBR1jHc1TygPHRO+GEyjMENrt3GLn2zXZg0VJ+S8EDuPSQR3sh14qDGWqbqpVk6+6ZF5QI5Ofx9lqAbNV7KjZT4W4RcXJ0VnTqPKUvhWm5+PfUbWMmnuQPebLjuVAkjiZUtY6OfVDowJdYmz4OLp6s64g+lH/Skz3lPKgVQKkWqrDDOy+wPsMBhiYWVGJvRkWA1f73mzhu6yTex/VivXg5PCck/xFN2/UiWTOYK4a/f8/XdVvN6yJd6XHH2lC7BJ+e8Trx0YeIC+3GNgv85rnlb4h31TzF4tmGV2cXB6d1Xw2KT0K+eS4KbTct5tCHOnnDZXvGhJDBrCH786jQIDAQAB';

// Only used for Chrome builds produced from the release-candidate branch.
export const CHROME_MANIFEST_KEY_RELEASE_CANDIDATE =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlcgI4VVL4JUvo6hlSgeCZp9mGltZrzFvc2Asqzb1dDGO9baoYOe+QRoh27/YyVXugxni480Q/R147INhBOyQZVMhZOD5pFMVutia9MHMaZhgRXzrK3BHtNSkKLL1c5mhutQNwiLqLtFkMSGvka91LoMEC8WTI0wi4tACnJ5FyFZQYzvtqy5sXo3VS3gzfOBluLKi7BxYcaUJjNrhOIxl1xL2qgK5lDrDOLKcbaurDiwqofVtAFOL5sM3uJ6D8nOO9tG+T7hoobRFN+nxk43PHgCv4poicOv+NMZQEk3da1m/xfuzXV88NcE/YRbRLwAS82m3gsJZKc6mLqm4wZHzBwIDAQAB';

/**
 * Collection of variable declarations required for the production build.
 * Grouped by build type.
 */
export const VARIABLES_REQUIRED_IN_PRODUCTION = {
  main: [
    'INFURA_PROD_PROJECT_ID',
    'SEGMENT_PROD_WRITE_KEY',
    'SENTRY_DSN',
    'QUICKNODE_MAINNET_URL',
    'QUICKNODE_LINEA_MAINNET_URL',
    'QUICKNODE_ARBITRUM_URL',
    'QUICKNODE_AVALANCHE_URL',
    'QUICKNODE_OPTIMISM_URL',
    'QUICKNODE_POLYGON_URL',
    'QUICKNODE_BASE_URL',
    'QUICKNODE_SEI_URL',
    'APPLE_PROD_CLIENT_ID',
    'GOOGLE_PROD_CLIENT_ID',
    'TELEGRAM_PROD_CLIENT_ID',
  ],
  beta: [
    'INFURA_BETA_PROJECT_ID',
    'SEGMENT_BETA_WRITE_KEY',
    'SENTRY_DSN',
    'APPLE_BETA_CLIENT_ID',
    'GOOGLE_BETA_CLIENT_ID',
    'TELEGRAM_BETA_CLIENT_ID',
  ],
  experimental: [
    'INFURA_EXPERIMENTAL_PROJECT_ID',
    'SEGMENT_EXPERIMENTAL_WRITE_KEY',
    'SENTRY_DSN',
    'GOOGLE_EXPERIMENTAL_CLIENT_ID',
    'APPLE_EXPERIMENTAL_CLIENT_ID',
    'TELEGRAM_EXPERIMENTAL_CLIENT_ID',
  ],
  flask: [
    'INFURA_FLASK_PROJECT_ID',
    'SEGMENT_FLASK_WRITE_KEY',
    'SENTRY_DSN',
    'APPLE_FLASK_CLIENT_ID',
    'GOOGLE_FLASK_CLIENT_ID',
    'TELEGRAM_FLASK_CLIENT_ID',
  ],
};
