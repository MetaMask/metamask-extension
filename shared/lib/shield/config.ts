import { ENVIRONMENT } from '../../constants/build';
import { ShieldEnvConfig } from './type';

/**
 * Shield backend API URLs for each environment.
 */
const SHIELD_ENV_CONFIG = {
  dev: {
    subscriptionApiUrl: 'https://subscription.dev-api.cx.metamask.io',
    claimsApiUrl: 'https://claims.dev-api.cx.metamask.io',
    shieldApiUrl: 'https://ruleset-engine.dev-api.cx.metamask.io',
    gatewayUrl: 'https://shield-gateway.dev-api.cx.metamask.io',
  },
  uat: {
    subscriptionApiUrl: 'https://subscription.uat-api.cx.metamask.io',
    claimsApiUrl: 'https://claims.uat-api.cx.metamask.io',
    shieldApiUrl: 'https://ruleset-engine.uat-api.cx.metamask.io',
    gatewayUrl: 'https://shield-gateway.uat-api.cx.metamask.io',
  },
  prd: {
    subscriptionApiUrl: 'https://subscription.api.cx.metamask.io',
    claimsApiUrl: 'https://claims.api.cx.metamask.io',
    shieldApiUrl: 'https://ruleset-engine.api.cx.metamask.io',
    gatewayUrl: 'https://shield-gateway.api.cx.metamask.io',
  },
} as const satisfies Record<string, ShieldEnvConfig>;

const BUILD_TYPE = {
  experimental: 'experimental',
  main: 'main',
  flask: 'flask',
  beta: 'beta',
  dev: 'dev',
  uat: 'uat',
} as const;

export type BuildType = (typeof BUILD_TYPE)[keyof typeof BUILD_TYPE];

export const ShieldConfigMap: Record<BuildType, ShieldEnvConfig> = {
  [BUILD_TYPE.main]: SHIELD_ENV_CONFIG.prd,
  [BUILD_TYPE.flask]: SHIELD_ENV_CONFIG.prd,
  [BUILD_TYPE.beta]: SHIELD_ENV_CONFIG.uat,
  [BUILD_TYPE.experimental]: SHIELD_ENV_CONFIG.prd,
  [BUILD_TYPE.dev]: SHIELD_ENV_CONFIG.dev,
  [BUILD_TYPE.uat]: SHIELD_ENV_CONFIG.uat,
};

/**
 * Check if the environment is a Development or Test environment.
 *
 * @returns true if the environment is a Development or Test environment, false otherwise
 */
export function isDevOrTestEnvironment() {
  return (
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING
  );
}

/**
 * Check if the build type is a UAT or DEV build.
 *
 * @returns true if the build type is a UAT or DEV build, false otherwise
 */
export function isDevOrUatBuild() {
  return (
    process.env.METAMASK_BUILD_TYPE === BUILD_TYPE.uat ||
    process.env.METAMASK_BUILD_TYPE === BUILD_TYPE.dev
  );
}

/**
 * Load the Shield config based on the build type and environment.
 *
 * @returns the Shield config
 */
export function loadShieldConfig(): ShieldEnvConfig {
  const buildType = process.env.METAMASK_BUILD_TYPE;

  let buildTypeEnv: BuildType = BUILD_TYPE.main;
  if (buildType === 'experimental') {
    buildTypeEnv = BUILD_TYPE.experimental;
  } else if (buildType === 'flask') {
    buildTypeEnv = BUILD_TYPE.flask;
    // `uat` build type for uat environment only build
  } else if (buildType === 'beta' || buildType === 'uat') {
    buildTypeEnv = BUILD_TYPE.beta;
  }

  return ShieldConfigMap[buildTypeEnv];
}
