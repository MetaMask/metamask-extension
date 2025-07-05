const path = require('path');
const { readFile } = require('fs/promises');
const assert = require('assert');
const { AssertionError } = require('assert');
const ini = require('ini');
const union = require('lodash/union');
const difference = require('lodash/difference');
const { loadBuildTypesConfig } = require('../lib/build-type');
const { Variables } = require('../lib/variables');
const { ENVIRONMENT } = require('./constants');

const VARIABLES_REQUIRED_IN_PRODUCTION = {
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
  ],
  beta: ['INFURA_BETA_PROJECT_ID', 'SEGMENT_BETA_WRITE_KEY', 'SENTRY_DSN'],
  flask: ['INFURA_FLASK_PROJECT_ID', 'SEGMENT_FLASK_WRITE_KEY', 'SENTRY_DSN'],
};

/** @type {readonly string[] | undefined} */
let cachedActiveFeatures;

/**
 * Set the active features for the current build. Should be called once per build, after
 * parsing the command line arguments. Always use {@link getActiveFeatures} to retrieve
 * the active features for the current build.
 *
 * @param {string} buildType - The current build type. The features of this build type will
 *  be included in the build.
 * @param {string[]} additionalFeatures - The additional features to include in the build.
 * @throws {Error} If any additional features are not defined in builds.yml.
 * @throws {Error} If active features have already been set.
 * @returns {string[]} The active features for the current build.
 */
function setActiveFeatures(buildType, additionalFeatures) {
  if (cachedActiveFeatures !== undefined) {
    throw new Error('Active features have already been set');
  }

  const config = loadBuildTypesConfig();

  const unknownFeatures = difference(
    additionalFeatures,
    Object.keys(config.features),
  );
  if (unknownFeatures.length > 0) {
    throw new Error(
      `The following features are not defined in builds.yml: ${unknownFeatures.join(
        ', ',
      )}`,
    );
  }

  cachedActiveFeatures = Object.freeze(
    union(additionalFeatures, config.buildTypes[buildType].features ?? []),
  );
  return [...cachedActiveFeatures];
}

/**
 * Get the active features for the current build. This should *always* be used to
 * retrieve the active features for the current build.
 *
 * @returns {string[]} The active features for the current build.
 * @throws {Error} If active features have not been set by {@link setActiveFeatures}.
 */
function getActiveFeatures() {
  if (cachedActiveFeatures === undefined) {
    throw new Error('Active features are not set');
  }
  return [...cachedActiveFeatures];
}

async function fromIniFile(filepath) {
  let configContents = '';
  try {
    configContents = await readFile(filepath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    return undefined;
  }

  const variables = ini.parse(configContents);
  assert(
    !Object.values(variables).some((variable) => typeof variable === 'object'),
    `When loading ${filepath} - INI categories are not supported`,
  );
  const entries = Object.entries(variables);

  const declarations = new Set(
    entries.filter(([, value]) => value === '').map(([key]) => key),
  );
  const definitions = new Map(
    entries
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, value]),
  );

  return { declarations, definitions };
}

function fromEnv(declarations) {
  const definitions = new Map(
    [...declarations]
      .filter((declaration) => declaration in process.env)
      .map((declaration) => [declaration, process.env[declaration]]),
  );
  return { definitions, declarations: new Set() };
}

function fromBuildsYML(buildType, config) {
  const extractDeclarations = (envObject) =>
    envObject === undefined ? [] : Object.keys(envObject);
  const extractDefinitions = (envObject) =>
    envObject === undefined
      ? []
      : Object.entries(envObject).filter(([, value]) => value !== undefined);

  // eslint-disable-next-line no-param-reassign
  buildType = buildType ?? config.default;
  const activeBuild = config.buildTypes[buildType];
  const activeFeatures = getActiveFeatures();

  let declarations = [...extractDeclarations(config.env)];

  activeFeatures
    .map((feature) => config.features[feature])
    .filter((feature) => feature !== null)
    .forEach(({ env }) => declarations.push(...extractDeclarations(env)));

  declarations.push(...extractDeclarations(activeBuild.env));
  declarations = new Set(declarations);

  const definitions = new Map();

  // 1. root env
  extractDefinitions(config.env).forEach(([key, value]) =>
    definitions.set(key, value),
  );
  // 2. features env
  activeFeatures
    .filter((key) => config.features[key] !== null)
    .map((key) => config.features[key].env)
    .map(extractDefinitions)
    .flat()
    .forEach(([key, value]) => definitions.set(key, value));
  // 3. build type env
  extractDefinitions(activeBuild.env).forEach(([key, value]) =>
    definitions.set(key, value),
  );

  return { declarations, definitions, activeBuild };
}

/**
 * @param {string} buildType - The chosen build type to build
 * @param {string} environment - The environment to build for
 * @returns Parsed configuration of the build pipeline
 */
async function getConfig(buildType, environment) {
  const config = loadBuildTypesConfig();
  const {
    declarations: ymlDeclarations,
    definitions: ymlDefinitions,
    activeBuild,
  } = fromBuildsYML(buildType, config);

  const variables = new Variables(ymlDeclarations);

  // notice that maps have inverted value and key pair in forEach
  ymlDefinitions.forEach((value, key) => variables.set(key, value));

  (
    await fromIniFile(path.resolve(__dirname, '..', '..', '.metamaskrc'))
  )?.definitions.forEach((value, key) => variables.set(key, value));
  (
    await fromIniFile(path.resolve(__dirname, '..', '..', '.metamaskprodrc'))
  )?.definitions.forEach((value, key) => variables.set(key, value));

  fromEnv(ymlDeclarations).definitions.forEach((value, key) =>
    variables.set(key, value),
  );

  // TODO(ritave): Move build targets and environments to builds.yml
  if (environment === ENVIRONMENT.PRODUCTION) {
    const undefinedVariables = VARIABLES_REQUIRED_IN_PRODUCTION[
      buildType
    ].filter((variable) => !variables.isDefined(variable));
    if (undefinedVariables.length !== 0) {
      const message = `Some variables required to build production target are not defined.
    - ${undefinedVariables.join('\n  - ')}
`;
      throw new AssertionError({ message });
    }
  }

  return {
    variables,
    activeBuild,
    buildsYml: config,
  };
}

module.exports = {
  fromIniFile,
  getConfig,
  getActiveFeatures,
  setActiveFeatures,
};
