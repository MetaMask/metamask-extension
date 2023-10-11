import { readFile } from 'fs/promises';
import path from 'path';
import ini from 'ini';
import phishingWarningManifest from '@metamask/phishing-warning/package.json';
import { ENVIRONMENT } from '../../build/constants';
import { BuildType } from '../../../shared/constants/app';
import { isErrorWithCode } from '../../../shared/modules/error';
import { generateIconNames } from '../../generate-icon-names';
import { BuildEnvironment, BuildTarget } from './constants';

interface EnvironmentConfig {
  PUBNUB_PUB_KEY?: string;
  PUBNUB_SUB_KEY?: string;
  NFTS_V1?: string;
  INFURA_PROJECT_ID?: string;
  PHISHING_WARNING_PAGE_URL?: string;
  PORTFOLIO_URL?: string;
  SEGMENT_HOST?: string;
  SEGMENT_WRITE_KEY?: string;
  SENTRY_DSN_DEV?: string;
  SENTRY_DSN_DEV_APIS?: string;
  SWAPS_USE_DEV_APIS?: string;
  TOKEN_ALLOWANCE_IMPROVEMENTS?: string;
  TRANSACTION_SECURITY_PROVIDER?: string;
  // Desktop
  COMPATIBILITY_VERSION_EXTENSION?: string;
  DISABLE_WEB_SOCKET_ENCRYPTION?: string;
  METAMASK_DEBUG?: string;
  SKIP_OTP_PAIRING_FLOW?: string;
  // Prod Variables
  INFURA_BETA_PROJECT_ID?: string;
  INFURA_FLASK_PROJECT_ID?: string;
  INFURA_PROD_PROJECT_ID?: string;
  SEGMENT_BETA_WRITE_KEY?: string;
  SEGMENT_FLASK_WRITE_KEY?: string;
  SEGMENT_PROD_WRITE_KEY?: string;
  SENTRY_DSN?: string;
}

const commonConfigurationPropertyNames = [
  'PUBNUB_PUB_KEY',
  'PUBNUB_SUB_KEY',
] as const;

const configurationPropertyNames = [
  ...commonConfigurationPropertyNames,
  'NFTS_V1',
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
] as const;

const productionConfigurationPropertyNames = [
  ...commonConfigurationPropertyNames,
  'INFURA_BETA_PROJECT_ID',
  'INFURA_FLASK_PROJECT_ID',
  'INFURA_PROD_PROJECT_ID',
  'SEGMENT_BETA_WRITE_KEY',
  'SEGMENT_FLASK_WRITE_KEY',
  'SEGMENT_PROD_WRITE_KEY',
  'SENTRY_DSN',
] as const;

/**
 * Get configuration for non-production builds.
 *
 * @returns The production configuration.
 */
async function getConfig(): Promise<EnvironmentConfig> {
  const configPath = path.resolve(__dirname, '..', '..', '.metamaskrc');
  let configContents = '';
  try {
    configContents = await readFile(configPath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (isErrorWithCode(error) && error.code !== 'ENOENT') {
      throw error;
    }
  }

  const environmentVariables: {
    [variable in typeof configurationPropertyNames[number]]?: string;
  } = {};
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
 * @param buildType - The current build type (e.g. "main", "flask",
 * etc.).
 * @returns The production configuration.
 */
async function getProductionConfig(
  buildType: typeof BuildType[keyof typeof BuildType],
): Promise<EnvironmentConfig> {
  const prodConfigPath = path.resolve(__dirname, '..', '..', '.metamaskprodrc');
  let prodConfigContents = '';
  try {
    prodConfigContents = await readFile(prodConfigPath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (isErrorWithCode(error) && error?.code !== 'ENOENT') {
      throw error;
    }
  }

  const environmentVariables: {
    [variable in typeof productionConfigurationPropertyNames[number]]?: string;
  } = {};
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
    all: ['PUBNUB_PUB_KEY', 'PUBNUB_SUB_KEY', 'SENTRY_DSN'] as const,
    [BuildType.beta]: [
      'INFURA_BETA_PROJECT_ID',
      'SEGMENT_BETA_WRITE_KEY',
    ] as const,
    [BuildType.flask]: [
      'INFURA_FLASK_PROJECT_ID',
      'SEGMENT_FLASK_WRITE_KEY',
    ] as const,
    [BuildType.main]: [
      'INFURA_PROD_PROJECT_ID',
      'SEGMENT_PROD_WRITE_KEY',
    ] as const,
    [BuildType.desktop]: [],
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
    if (!allValid.includes(environmentVariable as keyof typeof prodConfig)) {
      throw new Error(`Invalid environment variable: '${environmentVariable}'`);
    }
  }
  return prodConfig;
}

/**
 * Get the appropriate Infura project ID.
 *
 * @param options - The Infura project ID options.
 * @param options.buildType - The current build type.
 * @param options.config - The environment variable configuration.
 * @param options.environment - The build environment.
 * @param options.testing - Whether this is a test build or not.
 * @returns The Infura project ID.
 */
function getInfuraProjectId({
  buildType,
  config,
  environment,
  testing,
}: {
  buildType: BuildType;
  config: EnvironmentConfig;
  environment: BuildEnvironment;
  testing: boolean;
}) {
  if (testing) {
    return '00000000000000000000000000000000';
  } else if (environment !== ENVIRONMENT.PRODUCTION) {
    // Skip validation because this is unset on PRs from forks.
    return config.INFURA_PROJECT_ID;
  } else if (buildType === BuildType.main) {
    return config.INFURA_PROD_PROJECT_ID;
  } else if (buildType === BuildType.beta) {
    return config.INFURA_BETA_PROJECT_ID;
  } else if (buildType === BuildType.flask) {
    return config.INFURA_FLASK_PROJECT_ID;
  }
  throw new Error(`Invalid build type: '${buildType}'`);
}

/**
 * Get the appropriate Segment write key.
 *
 * @param options - The Segment write key options.
 * @param options.buildType - The current build type.
 * @param options.config - The environment variable configuration.
 * @param options.environment - The current build environment.
 * @returns The Segment write key.
 */
function getSegmentWriteKey({
  buildType,
  config,
  environment,
}: {
  buildType: BuildType;
  config: EnvironmentConfig;
  environment: BuildEnvironment;
}) {
  if (environment !== BuildEnvironment.production) {
    // Skip validation because this is unset on PRs from forks, and isn't necessary for development builds.
    return config.SEGMENT_WRITE_KEY;
  } else if (buildType === BuildType.main) {
    return config.SEGMENT_PROD_WRITE_KEY;
  } else if (buildType === BuildType.beta) {
    return config.SEGMENT_BETA_WRITE_KEY;
  } else if (buildType === BuildType.flask) {
    return config.SEGMENT_FLASK_WRITE_KEY;
  }
  throw new Error(`Invalid build type: '${buildType}'`);
}

/**
 * Get the URL for the phishing warning page, if it has been set.
 *
 * @param options - The phishing warning page options.
 * @param options.config - The environment variable configuration.
 * @param options.testing - Whether this is a test build or not.
 * @returns The URL for the phishing warning page, or `undefined` if no URL is set.
 */
function getPhishingWarningPageUrl({
  config,
  testing,
}: {
  config: EnvironmentConfig;
  testing: boolean;
}) {
  let phishingWarningPageUrl = config.PHISHING_WARNING_PAGE_URL;

  if (!phishingWarningPageUrl) {
    phishingWarningPageUrl = testing
      ? 'http://localhost:9999/'
      : `https://metamask.github.io/phishing-warning/v${phishingWarningManifest.version}/`;
  }

  // We add a hash/fragment to the URL dynamically, so we need to ensure it
  // has a valid pathname to append a hash to.
  const normalizedUrl = phishingWarningPageUrl.endsWith('/')
    ? phishingWarningPageUrl
    : `${phishingWarningPageUrl}/`;

  let phishingWarningPageUrlObject;
  try {
    // eslint-disable-next-line no-new
    phishingWarningPageUrlObject = new URL(normalizedUrl);
  } catch (error) {
    throw new Error(`Invalid phishing warning page URL: '${normalizedUrl}'`);
  }
  if (phishingWarningPageUrlObject.hash) {
    // The URL fragment must be set dynamically
    throw new Error(
      `URL fragment not allowed in phishing warning page URL: '${normalizedUrl}'`,
    );
  }

  return normalizedUrl;
}

/**
 * Returns whether the current build is a development build or not.
 *
 * @param buildTarget - The current build target.
 * @returns Whether the current build is a development build.
 */
function isDevBuild(buildTarget: BuildTarget) {
  return buildTarget === BuildTarget.dev || buildTarget === BuildTarget.testDev;
}

/**
 * Returns whether the current build is an e2e test build or not.
 *
 * @param buildTarget - The current build target.
 * @returns Whether the current build is an e2e test build.
 */
function isTestBuild(buildTarget: BuildTarget) {
  return (
    buildTarget === BuildTarget.test || buildTarget === BuildTarget.testDev
  );
}

/**
 * Get the environment of the current build.
 *
 * @param options - Build options.
 * @param options.buildTarget - The target of the current build.
 * @returns The current build environment.
 */
function getEnvironment({
  buildTarget,
}: {
  buildTarget: BuildTarget;
}): BuildEnvironment {
  // get environment slug
  if (buildTarget === BuildTarget.prod) {
    return BuildEnvironment.production;
  } else if (isDevBuild(buildTarget)) {
    return BuildEnvironment.development;
  } else if (isTestBuild(buildTarget)) {
    return BuildEnvironment.testing;
  } else if (
    /^Version-v(\d+)[.](\d+)[.](\d+)/u.test(process.env.CIRCLE_BRANCH ?? '')
  ) {
    return BuildEnvironment.releaseCandidate;
  } else if (process.env.CIRCLE_BRANCH === 'develop') {
    return BuildEnvironment.staging;
  } else if (process.env.CIRCLE_PULL_REQUEST) {
    return BuildEnvironment.pullRequest;
  }
  return BuildEnvironment.other;
}

/**
 * Get environment variables to inject in the current build.
 *
 * @param options - Build options.
 * @param options.buildTarget - The current build target.
 * @param options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param options.version - The current version of the extension.
 * @returns A map of environment variables to inject.
 */
export async function getEnvironmentVariables({
  buildTarget,
  buildType,
  version,
}: {
  buildTarget: BuildTarget;
  buildType: BuildType;
  version: string;
}) {
  const environment = getEnvironment({ buildTarget });
  const config =
    environment === ENVIRONMENT.PRODUCTION
      ? await getProductionConfig(buildType)
      : await getConfig();

  const devMode = isDevBuild(buildTarget);
  const testing = isTestBuild(buildTarget);
  const iconNames = await generateIconNames();
  return {
    ICON_NAMES: iconNames,
    NFTS_V1: config.NFTS_V1 === '1',
    CONF: devMode ? config : {},
    IN_TEST: testing,
    INFURA_PROJECT_ID: getInfuraProjectId({
      buildType,
      config,
      environment,
      testing,
    }),
    METAMASK_DEBUG: devMode || config.METAMASK_DEBUG === '1',
    METAMASK_ENVIRONMENT: environment,
    METAMASK_VERSION: version,
    METAMASK_BUILD_TYPE: buildType,
    NODE_ENV: devMode ? ENVIRONMENT.DEVELOPMENT : ENVIRONMENT.PRODUCTION,
    PHISHING_WARNING_PAGE_URL: getPhishingWarningPageUrl({ config, testing }),
    PORTFOLIO_URL: config.PORTFOLIO_URL || 'https://portfolio.metamask.io',
    PUBNUB_PUB_KEY: config.PUBNUB_PUB_KEY || '',
    PUBNUB_SUB_KEY: config.PUBNUB_SUB_KEY || '',
    SEGMENT_HOST: config.SEGMENT_HOST || '',
    SEGMENT_WRITE_KEY:
      getSegmentWriteKey({ buildType, config, environment }) || '',
    SENTRY_DSN: config.SENTRY_DSN || '',
    SENTRY_DSN_DEV: config.SENTRY_DSN_DEV || '',
    SWAPS_USE_DEV_APIS: config.SWAPS_USE_DEV_APIS === '1',
    TOKEN_ALLOWANCE_IMPROVEMENTS: config.TOKEN_ALLOWANCE_IMPROVEMENTS === '1',
    TRANSACTION_SECURITY_PROVIDER: config.TRANSACTION_SECURITY_PROVIDER === '1',
    // Desktop
    COMPATIBILITY_VERSION_EXTENSION:
      config.COMPATIBILITY_VERSION_EXTENSION || '',
    DISABLE_WEB_SOCKET_ENCRYPTION: config.DISABLE_WEB_SOCKET_ENCRYPTION === '1',
    SKIP_OTP_PAIRING_FLOW: config.SKIP_OTP_PAIRING_FLOW === '1',
  };
}
