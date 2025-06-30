/**
 * The build target. This descrbes the overall purpose of the build.
 *
 * These constants also act as the high-level tasks for the build system (i.e.
 * the usual tasks invoked directly via the CLI rather than internally).
 */
const BUILD_TARGETS = {
  DEV: 'dev',
  DIST: 'dist',
  PROD: 'prod',
  TEST: 'test',
  TEST_DEV: 'testDev',
};

/**
 * The build environment. This describes the environment this build was produced in.
 */
const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  OTHER: 'other',
  PULL_REQUEST: 'pull-request',
  RELEASE_CANDIDATE: 'release-candidate',
  STAGING: 'staging',
  TESTING: 'testing',
};

const TASKS = {
  ...BUILD_TARGETS,
  CLEAN: 'clean',
  LINT_SCSS: 'lint-scss',
  MANIFEST_DEV: 'manifest:dev',
  MANIFEST_PROD: 'manifest:prod',
  MANIFEST_SCRIPT_DIST: 'manifest:scriptDist',
  MANIFEST_TEST: 'manifest:test',
  MANIFEST_TEST_DEV: 'manifest:testDev',
  RELOAD: 'reload',
  SCRIPTS_CORE_DEV_STANDARD_ENTRY_POINTS:
    'scripts:core:dev:standardEntryPoints',
  SCRIPTS_CORE_DEV_CONTENTSCRIPT: 'scripts:core:dev:contentscript',
  SCRIPTS_CORE_DEV_DISABLE_CONSOLE: 'scripts:core:dev:disable-console',
  SCRIPTS_CORE_DEV_SENTRY: 'scripts:core:dev:sentry',
  SCRIPTS_CORE_DEV_PHISHING_DETECT: 'scripts:core:dev:phishing-detect',
  SCRIPTS_CORE_DIST_STANDARD_ENTRY_POINTS:
    'scripts:core:dist:standardEntryPoints',
  SCRIPTS_CORE_DIST_CONTENTSCRIPT: 'scripts:core:dist:contentscript',
  SCRIPTS_CORE_DIST_DISABLE_CONSOLE: 'scripts:core:dist:disable-console',
  SCRIPTS_CORE_DIST_SENTRY: 'scripts:core:dist:sentry',
  SCRIPTS_CORE_DIST_PHISHING_DETECT: 'scripts:core:dist:phishing-detect',
  SCRIPTS_CORE_PROD_STANDARD_ENTRY_POINTS:
    'scripts:core:prod:standardEntryPoints',
  SCRIPTS_CORE_PROD_CONTENTSCRIPT: 'scripts:core:prod:contentscript',
  SCRIPTS_CORE_PROD_DISABLE_CONSOLE: 'scripts:core:prod:disable-console',
  SCRIPTS_CORE_PROD_SENTRY: 'scripts:core:prod:sentry',
  SCRIPTS_CORE_PROD_PHISHING_DETECT: 'scripts:core:prod:phishing-detect',
  SCRIPTS_CORE_TEST_LIVE_STANDARD_ENTRY_POINTS:
    'scripts:core:test-live:standardEntryPoints',
  SCRIPTS_CORE_TEST_LIVE_CONTENTSCRIPT: 'scripts:core:test-live:contentscript',
  SCRIPTS_CORE_TEST_LIVE_DISABLE_CONSOLE:
    'scripts:core:test-live:disable-console',
  SCRIPTS_CORE_TEST_LIVE_SENTRY: 'scripts:core:test-live:sentry',
  SCRIPTS_CORE_TEST_LIVE_PHISHING_DETECT:
    'scripts:core:test-live:phishing-detect',
  SCRIPTS_CORE_TEST_STANDARD_ENTRY_POINTS:
    'scripts:core:test:standardEntryPoints',
  SCRIPTS_CORE_TEST_CONTENTSCRIPT: 'scripts:core:test:contentscript',
  SCRIPTS_CORE_TEST_DISABLE_CONSOLE: 'scripts:core:test:disable-console',
  SCRIPTS_CORE_TEST_SENTRY: 'scripts:core:test:sentry',
  SCRIPTS_CORE_TEST_PHISHING_DETECT: 'scripts:core:test:phishing-detect',
  SCRIPTS_DIST: 'scripts:dist',
  STATIC_DEV: 'static:dev',
  STATIC_PROD: 'static:prod',
  STYLES: 'styles',
  STYLES_DEV: 'styles:dev',
  STYLES_PROD: 'styles:prod',
  ZIP: 'zip',
};

// manifest key use for development, to get the consistent extension id (required for OAuth)
const MANIFEST_DEV_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqZDxqBR1jHc1TygPHRO+GEyjMENrt3GLn2zXZg0VJ+S8EDuPSQR3sh14qDGWqbqpVk6+6ZF5QI5Ofx9lqAbNV7KjZT4W4RcXJ0VnTqPKUvhWm5+PfUbWMmnuQPebLjuVAkjiZUtY6OfVDowJdYmz4OLp6s64g+lH/Skz3lPKgVQKkWqrDDOy+wPsMBhiYWVGJvRkWA1f73mzhu6yTex/VivXg5PCck/xFN2/UiWTOYK4a/f8/XdVvN6yJd6XHH2lC7BJ+e8Trx0YeIC+3GNgv85rnlb4h31TzF4tmGV2cXB6d1Xw2KT0K+eS4KbTct5tCHOnnDZXvGhJDBrCH786jQIDAQAB';

module.exports = { BUILD_TARGETS, ENVIRONMENT, TASKS, MANIFEST_DEV_KEY };
