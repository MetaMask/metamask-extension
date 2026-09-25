import { Env as SubscriptionEnv } from '@metamask/subscription-controller';
import { Env as ClaimsEnv } from '@metamask/claims-controller';
import { ENVIRONMENT } from '../../constants/build';
import { ShieldEnvConfig } from './type';

const SHIELD_GATEWAY_URL = {
  [SubscriptionEnv.DEV]: 'https://shield-gateway.dev-api.cx.metamask.io',
  [SubscriptionEnv.UAT]: 'https://shield-gateway.uat-api.cx.metamask.io',
  [SubscriptionEnv.PRD]: 'https://shield-gateway.api.cx.metamask.io',
} as const;

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
  [BUILD_TYPE.main]: {
    subscriptionEnv: SubscriptionEnv.PRD,
    claimsEnv: ClaimsEnv.PRD,
    shieldEnv: SubscriptionEnv.PRD,
    gatewayUrl: SHIELD_GATEWAY_URL[SubscriptionEnv.PRD],
  },
  [BUILD_TYPE.flask]: {
    subscriptionEnv: SubscriptionEnv.PRD,
    claimsEnv: ClaimsEnv.PRD,
    shieldEnv: SubscriptionEnv.PRD,
    gatewayUrl: SHIELD_GATEWAY_URL[SubscriptionEnv.PRD],
  },
  [BUILD_TYPE.beta]: {
    subscriptionEnv: SubscriptionEnv.UAT,
    claimsEnv: ClaimsEnv.UAT,
    shieldEnv: SubscriptionEnv.UAT,
    gatewayUrl: SHIELD_GATEWAY_URL[SubscriptionEnv.UAT],
  },
  [BUILD_TYPE.experimental]: {
    subscriptionEnv: SubscriptionEnv.PRD,
    claimsEnv: ClaimsEnv.PRD,
    shieldEnv: SubscriptionEnv.PRD,
    gatewayUrl: SHIELD_GATEWAY_URL[SubscriptionEnv.PRD],
  },
  [BUILD_TYPE.dev]: {
    subscriptionEnv: SubscriptionEnv.DEV,
    claimsEnv: ClaimsEnv.DEV,
    shieldEnv: SubscriptionEnv.DEV,
    gatewayUrl: SHIELD_GATEWAY_URL[SubscriptionEnv.DEV],
  },
  [BUILD_TYPE.uat]: {
    subscriptionEnv: SubscriptionEnv.UAT,
    claimsEnv: ClaimsEnv.UAT,
    shieldEnv: SubscriptionEnv.UAT,
    gatewayUrl: SHIELD_GATEWAY_URL[SubscriptionEnv.UAT],
  },
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
