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
    'QUICKNODE_BSC_URL',
    'QUICKNODE_SEI_URL',
    'APPLE_PROD_CLIENT_ID',
    'GOOGLE_PROD_CLIENT_ID',
  ],
  beta: [
    'INFURA_BETA_PROJECT_ID',
    'SEGMENT_BETA_WRITE_KEY',
    'SENTRY_DSN',
    'APPLE_BETA_CLIENT_ID',
    'GOOGLE_BETA_CLIENT_ID',
  ],
  experimental: [
    'INFURA_EXPERIMENTAL_PROJECT_ID',
    'SEGMENT_EXPERIMENTAL_WRITE_KEY',
    'SENTRY_DSN',
    'GOOGLE_EXPERIMENTAL_CLIENT_ID',
    'APPLE_EXPERIMENTAL_CLIENT_ID',
  ],
  flask: [
    'INFURA_FLASK_PROJECT_ID',
    'SEGMENT_FLASK_WRITE_KEY',
    'SENTRY_DSN',
    'APPLE_FLASK_CLIENT_ID',
    'GOOGLE_FLASK_CLIENT_ID',
  ],
};

/**
 * The build environment. This describes the environment this build was produced in.
 */
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  OTHER: 'other',
  PULL_REQUEST: 'pull-request',
  RELEASE_CANDIDATE: 'release-candidate',
  STAGING: 'staging',
  TESTING: 'testing',
};
