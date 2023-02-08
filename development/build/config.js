const path = require('path');
const { readFile } = require('fs/promises');
const ini = require('ini');
const { BuildType } = require('../lib/build-type');

const commonConfigurationPropertyNames = ['PUBNUB_PUB_KEY', 'PUBNUB_SUB_KEY'];

const configurationPropertyNames = [
  ...commonConfigurationPropertyNames,
  'NFTS_V1',
  'INFURA_PROJECT_ID',
  'PHISHING_WARNING_PAGE_URL',
  'PORTFOLIO_URL',
  'SEGMENT_HOST',
  'SEGMENT_WRITE_KEY',
  'SENTRY_DSN_DEV',
  'SIWE_V1',
  'SWAPS_USE_DEV_APIS',
];

const productionConfigurationPropertyNames = [
  ...commonConfigurationPropertyNames,
  'INFURA_BETA_PROJECT_ID',
  'INFURA_FLASK_PROJECT_ID',
  'INFURA_PROD_PROJECT_ID',
  'SEGMENT_BETA_WRITE_KEY',
  'SEGMENT_FLASK_WRITE_KEY',
  'SEGMENT_PROD_WRITE_KEY',
  'SENTRY_DSN',
];

/**
 * Get configuration for non-production builds.
 *
 * @returns {object} The production configuration.
 */
async function getConfig() {
  const configPath = path.resolve(__dirname, '..', '..', '.metamaskrc');
  let configContents = '';
  try {
    configContents = await readFile(configPath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const environmentVariables = {};
  for (const propertyName of configurationPropertyNames) {
    if (process.env[propertyName]) {
      environmentVariables[propertyName] = process.env[propertyName];
    }
  }

  return {
    ...ini.parse(configContents),
    ...environmentVariables,
  };
}

/**
 * Get configuration for production builds and perform validation.
 *
 * This function validates that all required variables are present, and that
 * the production configuration file doesn't include any extraneous entries.
 *
 * @param {BuildType} buildType - The current build type (e.g. "main", "flask",
 * etc.).
 * @returns {object} The production configuration.
 */
async function getProductionConfig(buildType) {
  const prodConfigPath = path.resolve(__dirname, '..', '..', '.metamaskprodrc');
  let prodConfigContents = '';
  try {
    prodConfigContents = await readFile(prodConfigPath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const environmentVariables = {};
  for (const propertyName of productionConfigurationPropertyNames) {
    if (process.env[propertyName]) {
      environmentVariables[propertyName] = process.env[propertyName];
    }
  }

  const prodConfig = {
    ...ini.parse(prodConfigContents),
    ...environmentVariables,
  };

  const requiredEnvironmentVariables = {
    all: ['PUBNUB_PUB_KEY', 'PUBNUB_SUB_KEY', 'SENTRY_DSN'],
    [BuildType.beta]: ['INFURA_BETA_PROJECT_ID', 'SEGMENT_BETA_WRITE_KEY'],
    [BuildType.flask]: ['INFURA_FLASK_PROJECT_ID', 'SEGMENT_FLASK_WRITE_KEY'],
    [BuildType.main]: ['INFURA_PROD_PROJECT_ID', 'SEGMENT_PROD_WRITE_KEY'],
  };

  for (const required of [
    ...requiredEnvironmentVariables.all,
    ...requiredEnvironmentVariables[buildType],
  ]) {
    if (!prodConfig[required]) {
      throw new Error(`Missing '${required}' environment variable`);
    }
  }

  const allValid = Object.values(requiredEnvironmentVariables).flat();
  for (const environmentVariable of Object.keys(prodConfig)) {
    if (!allValid.includes(environmentVariable)) {
      throw new Error(`Invalid environment variable: '${environmentVariable}'`);
    }
  }
  return prodConfig;
}

module.exports = { getConfig, getProductionConfig };
