const path = require('path');
const { readFile } = require('fs/promises');
const fs = require('fs');
const ini = require('ini');
const yaml = require('js-yaml');
const { loadBuildTypesConfig } = require('../lib/build-type');
const { union } = require('lodash');

const configurationPropertyNames = [
  'MULTICHAIN',
  'INFURA_PROJECT_ID',
  'PHISHING_WARNING_PAGE_URL',
  'PORTFOLIO_URL',
  'SEGMENT_HOST',
  'SEGMENT_WRITE_KEY',
  'SENTRY_DSN_DEV',
  'SWAPS_USE_DEV_APIS',
  // Desktop
  'COMPATIBILITY_VERSION_EXTENSION',
  'DISABLE_WEB_SOCKET_ENCRYPTION',
  'METAMASK_DEBUG',
  'SKIP_OTP_PAIRING_FLOW',
  'ENABLE_MV3',
];

const productionConfigurationPropertyNames = [
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
 * @param {string} buildType - The current build type (e.g. "main", "flask",
 * etc.).
 * @returns {object} The production configuration.
 */
async function getProductionConfig(buildType) {
  asd;
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

  const buildTypes = loadBuildTypesConfig();

  const requiredEnvironmentVariables = union(
    buildTypes.env,
    buildTypes.builds[buildType].env ?? [],
  );

  for (const required of requiredEnvironmentVariables) {
    if (!prodConfig[required]) {
      throw new Error(`Missing '${required}' environment variable`);
    }
  }

  const allValid = Object.values(buildTypes.builds)
    .map((build) => build.env ?? [])
    .flat();
  for (const environmentVariable of Object.keys(prodConfig)) {
    if (!allValid.includes(environmentVariable)) {
      throw new Error(`Invalid environment variable: '${environmentVariable}'`);
    }
  }
  return prodConfig;
}

module.exports = {
  getConfig,
  getProductionConfig,
  getBuildTypesConfig,
};
