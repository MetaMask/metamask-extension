import { Web3AuthNetwork } from '@metamask/seedless-onboarding-controller';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { OAuthConfig } from './types';

export enum BuildTypeEnv {
  /**
   * Development build for main build type.
   * This will be used when we run the development build. (e.g. `yarn start`)
   */
  DevMain = 'DevMain',

  /**
   * Development build for flask build type.
   * This will be used when we run the development flask build. (e.g. `yarn start:flask`)
   */
  DevFlask = 'DevFlask',

  /**
   * UAT (QA) build for main build type.
   * This will be used when we run the UAT (QA or dist) build. (e.g. `yarn dist`)
   */
  UatMain = 'UatMain',

  /**
   * UAT build for flask build type.
   * This will be used when we run the UAT (QA or dist) flask build. (e.g. `yarn build --build-type flask dist`)
   */
  UatFlask = 'UatFlask',

  /**
   * Production build for main build type.
   * This will be used when we run the production build. (e.g. `yarn build prod`)
   */
  ProdMain = 'ProdMain',

  /**
   * Production build for flask build type.
   * This will be used when we run the production flask build. (e.g. `yarn build --build-type flask prod`)
   */
  ProdFlask = 'ProdFlask',

  /**
   * Beta build for main build type.
   * This will be used when we run the beta build. (e.g. `yarn build beta`)
   */
  Beta = 'Beta',
}

export const OauthConfigMap: Record<BuildTypeEnv, OAuthConfig> = {
  [BuildTypeEnv.DevMain]: {
    googleAuthConnectionId: 'mm-google-dev-extension',
    appleAuthConnectionId: 'mm-apple-dev-common',
    googleGroupedAuthConnectionId: 'mm-google-dev',
    appleGroupedAuthConnectionId: 'mm-apple-dev',
    authServerUrl: 'https://auth-service.dev-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
  },
  [BuildTypeEnv.DevFlask]: {
    googleAuthConnectionId: 'mm-google-flask-dev-extension',
    appleAuthConnectionId: 'mm-apple-flask-dev-common',
    googleGroupedAuthConnectionId: 'mm-google-flask-dev',
    appleGroupedAuthConnectionId: 'mm-apple-flask-dev',
    authServerUrl: 'https://auth-service.dev-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
  },
  [BuildTypeEnv.UatMain]: {
    googleAuthConnectionId: 'mm-google-uat-extension',
    appleAuthConnectionId: 'mm-apple-uat-common',
    googleGroupedAuthConnectionId: 'mm-google-uat',
    appleGroupedAuthConnectionId: 'mm-apple-uat',
    authServerUrl: 'https://auth-service.uat-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
  [BuildTypeEnv.UatFlask]: {
    googleAuthConnectionId: 'mm-google-flask-uat-extension',
    appleAuthConnectionId: 'mm-apple-flask-uat-common',
    googleGroupedAuthConnectionId: 'mm-google-flask-uat',
    appleGroupedAuthConnectionId: 'mm-apple-flask-uat',
    authServerUrl: 'https://auth-service.uat-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
  [BuildTypeEnv.ProdMain]: {
    googleAuthConnectionId: 'mm-google-main-extension',
    appleAuthConnectionId: 'mm-apple-main-common',
    googleGroupedAuthConnectionId: 'mm-google-main',
    appleGroupedAuthConnectionId: 'mm-apple-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
  [BuildTypeEnv.ProdFlask]: {
    googleAuthConnectionId: 'mm-google-flask-main-extension',
    appleAuthConnectionId: 'mm-apple-flask-main-common',
    googleGroupedAuthConnectionId: 'mm-google-flask-main',
    appleGroupedAuthConnectionId: 'mm-apple-flask-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
  [BuildTypeEnv.Beta]: {
    googleAuthConnectionId: 'mm-google-main-extension',
    appleAuthConnectionId: 'mm-apple-main-common',
    googleGroupedAuthConnectionId: 'mm-google-main',
    appleGroupedAuthConnectionId: 'mm-apple-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
};

/**
 * Check if the build is a Development or Test build.
 *
 * @returns true if the build is a Development or Test build, false otherwise
 */
export function isDevOrTestBuild() {
  return (
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING
  );
}

/**
 * Check if the build is a Production build.
 *
 * @returns true if the build is a Production build, false otherwise
 */
function isProductionBuild() {
  return process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.PRODUCTION;
}

/**
 * Check if the build is from the release candidate branch.
 * Example: `Version-v13.0.0` branch.
 *
 * @returns true if the build is from the release candidate branch, false otherwise
 */
function isReleaseCandidateBuild() {
  return process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.RELEASE_CANDIDATE;
}

/**
 * Load the OAuth config based on the build type and environment.
 *
 * @returns the OAuth config
 */
export function loadOAuthConfig(): OAuthConfig {
  const buildType = process.env.METAMASK_BUILD_TYPE;

  let buildTypeEnv = BuildTypeEnv.DevMain;
  if (buildType === 'main') {
    if (isDevOrTestBuild()) {
      buildTypeEnv = BuildTypeEnv.DevMain;
    } else if (isProductionBuild() || isReleaseCandidateBuild()) {
      buildTypeEnv = BuildTypeEnv.ProdMain;
    } else {
      buildTypeEnv = BuildTypeEnv.UatMain;
    }
  } else if (buildType === 'flask') {
    if (isDevOrTestBuild()) {
      buildTypeEnv = BuildTypeEnv.DevFlask;
    } else if (isProductionBuild() || isReleaseCandidateBuild()) {
      buildTypeEnv = BuildTypeEnv.ProdFlask;
    } else {
      buildTypeEnv = BuildTypeEnv.UatFlask;
    }
  } else if (buildType === 'beta') {
    buildTypeEnv = BuildTypeEnv.Beta;
  }

  return OauthConfigMap[buildTypeEnv];
}
