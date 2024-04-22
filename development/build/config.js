const path = require('path');
const { readFile } = require('fs/promises');
const assert = require('assert');
const { AssertionError } = require('assert');
const ini = require('ini');
const { loadBuildTypesConfig } = require('../lib/build-type');
const { Variables } = require('../lib/variables');
const { ENVIRONMENT } = require('./constants');

const VARIABLES_REQUIRED_IN_PRODUCTION = {
  main: ['INFURA_PROD_PROJECT_ID', 'SEGMENT_PROD_WRITE_KEY', 'SENTRY_DSN'],
  beta: ['INFURA_BETA_PROJECT_ID', 'SEGMENT_BETA_WRITE_KEY', 'SENTRY_DSN'],
  flask: ['INFURA_FLASK_PROJECT_ID', 'SEGMENT_FLASK_WRITE_KEY', 'SENTRY_DSN'],
  mmi: [
    'INFURA_MMI_PROJECT_ID',
    'MMI_CONFIGURATION_SERVICE_URL',
    'SEGMENT_MMI_WRITE_KEY',
    'SENTRY_DSN',
  ],
};

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
  const extractDeclarations = (envArray) =>
    envArray === undefined
      ? []
      : envArray.map((env) => (typeof env === 'string' ? env : env.key));
  const extractDefinitions = (envArray) =>
    envArray === undefined
      ? []
      : envArray.filter((env) => typeof env !== 'string');

  // eslint-disable-next-line no-param-reassign
  buildType = buildType ?? config.default;
  const activeBuild = config.buildTypes[buildType];
  const activeFeatures = activeBuild.features ?? [];

  let declarations = [...extractDeclarations(config.env)];

  activeFeatures
    .map((feature) => config.features[feature])
    .filter((feature) => feature !== null)
    .forEach(({ env }) => declarations.push(...extractDeclarations(env)));

  declarations.push(...extractDeclarations(activeBuild.env));
  declarations = new Set(declarations);

  const definitions = new Map();

  // 1. root env
  extractDefinitions(config.env).forEach(({ key, value }) =>
    definitions.set(key, value),
  );
  // 2. features env
  activeFeatures
    .filter((key) => config.features[key] !== null)
    .map((key) => config.features[key].env)
    .map(extractDefinitions)
    .flat()
    .forEach(({ key, value }) => definitions.set(key, value));
  // 3. build type env
  extractDefinitions(activeBuild.env).forEach(({ key, value }) =>
    definitions.set(key, value),
  );

  return { declarations, definitions, activeFeatures, activeBuild };
}

/**
 *
 * @param {string?} buildType - The chosen build type to build
 * @param environment
 * @returns Parsed configuration of the build pipeline
 */
async function getConfig(buildType, environment) {
  const config = loadBuildTypesConfig();
  const {
    declarations: ymlDeclarations,
    definitions: ymlDefinitions,
    activeBuild,
    activeFeatures,
  } = await fromBuildsYML(buildType, config);

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
    activeFeatures,
    buildsYml: config,
  };
}

module.exports = {
  getConfig,
};
