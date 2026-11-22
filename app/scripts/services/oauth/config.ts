import { Web3AuthNetwork } from '@metamask/seedless-onboarding-controller';
import { Env as ProfileSyncEnv } from '@metamask/profile-sync-controller/sdk';
import { ENVIRONMENT } from '../../../../shared/constants/build';
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
   * This will be used when we run the UAT (QA or dist) flask build. (e.g. `yarn dist --type flask`)
   */
  UatFlask = 'UatFlask',

  /**
   * Production build for main build type.
   * This will be used when we run the production build. (e.g. `yarn webpack:lavamoat:build --zip --env production`)
   */
  ProdMain = 'ProdMain',

  /**
   * Production build for flask build type.
   * This will be used when we run the production flask build. (e.g. `yarn webpack:lavamoat:build --type flask --zip --env production`)
   */
  ProdFlask = 'ProdFlask',

  /**
   * Beta build for (production or release candidate) main build type.
   * This will be used when we run the beta build (e.g. `yarn webpack:lavamoat:build --type beta --zip`) on the
   * (production or release candidate) environment.
   */
  Beta = 'Beta',

  /**
   * Beta build for the UAT environment.
   * This will be used when we run the beta build (e.g. `yarn webpack:lavamoat:build --type beta --zip`) on the feature PRs.
   */
  UatBeta = 'UatBeta',
}

export const OauthConfigMap: Record<BuildTypeEnv, OAuthConfig> = {
  [BuildTypeEnv.DevMain]: {
    googleClientId:
      '615965109465-i8oeh9kuvl1n6lk1ffkobpvth27bmi41.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.dev',
    telegramClientId: '8648706996',
    googleAuthConnectionId: 'mm-google-dev-extension',
    appleAuthConnectionId: 'mm-apple-dev-common',
    googleGroupedAuthConnectionId: 'mm-google-dev',
    appleGroupedAuthConnectionId: 'mm-apple-dev',
    telegramAuthConnectionId: 'mm-telegram-auth-dev-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-auth-dev',
    authServerUrl: 'https://auth-service.dev-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
    profileSyncEnv: ProfileSyncEnv.DEV,
  },
  [BuildTypeEnv.DevFlask]: {
    googleClientId:
      '615965109465-ab20kuqbls6fj5s50fvmvbnket8nv1sh.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.flask.dev',
    telegramClientId: '8935500495',
    googleAuthConnectionId: 'mm-google-flask-dev-extension',
    appleAuthConnectionId: 'mm-apple-flask-dev-common',
    googleGroupedAuthConnectionId: 'mm-google-flask-dev',
    appleGroupedAuthConnectionId: 'mm-apple-flask-dev',
    telegramAuthConnectionId: 'mm-telegram-auth-dev-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-auth-dev',
    authServerUrl: 'https://auth-service.dev-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
    profileSyncEnv: ProfileSyncEnv.DEV,
  },
  [BuildTypeEnv.UatMain]: {
    googleClientId:
      '387141446914-olajr83p1bbvabh1u8tfglt1k4u6jlcb.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.uat',
    telegramClientId: '8645620447',
    googleAuthConnectionId: 'mm-google-uat-extension',
    appleAuthConnectionId: 'mm-apple-uat-common',
    googleGroupedAuthConnectionId: 'mm-google-uat',
    appleGroupedAuthConnectionId: 'mm-apple-uat',
    telegramAuthConnectionId: 'mm-telegram-uat-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-uat',
    authServerUrl: 'https://auth-service.uat-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
    profileSyncEnv: ProfileSyncEnv.UAT,
  },
  [BuildTypeEnv.UatBeta]: {
    googleClientId:
      '387141446914-olajr83p1bbvabh1u8tfglt1k4u6jlcb.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.uat',
    telegramClientId: '8645620447',
    googleAuthConnectionId: 'mm-google-uat-extension',
    appleAuthConnectionId: 'mm-apple-uat-common',
    googleGroupedAuthConnectionId: 'mm-google-uat',
    appleGroupedAuthConnectionId: 'mm-apple-uat',
    telegramAuthConnectionId: 'mm-telegram-uat-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-uat',
    authServerUrl: 'https://auth-service.uat-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
    profileSyncEnv: ProfileSyncEnv.UAT,
  },
  [BuildTypeEnv.UatFlask]: {
    googleClientId:
      '387141446914-f03k9ivc2jrmi1s53lne88mh529372kj.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.flask.uat',
    telegramClientId: '8490765053',
    googleAuthConnectionId: 'mm-google-flask-uat-extension',
    appleAuthConnectionId: 'mm-apple-flask-uat-common',
    googleGroupedAuthConnectionId: 'mm-google-flask-uat',
    appleGroupedAuthConnectionId: 'mm-apple-flask-uat',
    telegramAuthConnectionId: 'mm-telegram-flask-uat-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-flask-uat',
    authServerUrl: 'https://auth-service.uat-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
    profileSyncEnv: ProfileSyncEnv.UAT,
  },
  [BuildTypeEnv.ProdMain]: {
    googleClientId:
      '795351133007-6d0s31utj13knv440fgjo2ur93241gb6.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.prod',
    telegramClientId: '8775377623',
    googleAuthConnectionId: 'mm-google-main-extension',
    appleAuthConnectionId: 'mm-apple-main-common',
    googleGroupedAuthConnectionId: 'mm-google-main',
    appleGroupedAuthConnectionId: 'mm-apple-main',
    telegramAuthConnectionId: 'mm-telegram-main-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
    profileSyncEnv: ProfileSyncEnv.PRD,
  },
  [BuildTypeEnv.ProdFlask]: {
    googleClientId:
      '795351133007-gh67d3hot6ib24htu9d7sh01bg90lpdu.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.flask.prod',
    telegramClientId: '8510781700',
    googleAuthConnectionId: 'mm-google-flask-main-extension',
    appleAuthConnectionId: 'mm-apple-flask-main-common',
    googleGroupedAuthConnectionId: 'mm-google-flask-main',
    appleGroupedAuthConnectionId: 'mm-apple-flask-main',
    telegramAuthConnectionId: 'mm-telegram-flask-main-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-flask-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
    profileSyncEnv: ProfileSyncEnv.PRD,
  },
  [BuildTypeEnv.Beta]: {
    googleClientId:
      '795351133007-6d0s31utj13knv440fgjo2ur93241gb6.apps.googleusercontent.com',
    appleClientId: 'io.metamask.appleloginclient.prod',
    telegramClientId: '8775377623',
    googleAuthConnectionId: 'mm-google-main-extension',
    appleAuthConnectionId: 'mm-apple-main-common',
    googleGroupedAuthConnectionId: 'mm-google-main',
    appleGroupedAuthConnectionId: 'mm-apple-main',
    telegramAuthConnectionId: 'mm-telegram-main-common',
    telegramGroupedAuthConnectionId: 'mm-telegram-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
    profileSyncEnv: ProfileSyncEnv.PRD,
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
export function isProductionBuild() {
  return process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.PRODUCTION;
}

/**
 * Check if the build is from the release candidate branch.
 * Example: `release/13.0.0` branch.
 *
 * @returns true if the build is from the release candidate branch, false otherwise
 */
export function isReleaseCandidateBuild() {
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
  if (buildType === 'main' || buildType === 'experimental') {
    if (isProductionBuild() || isReleaseCandidateBuild()) {
      buildTypeEnv = BuildTypeEnv.ProdMain;
    } else if (isDevOrTestBuild()) {
      buildTypeEnv = BuildTypeEnv.DevMain;
    } else {
      buildTypeEnv = BuildTypeEnv.UatMain;
    }
  } else if (buildType === 'flask') {
    if (isProductionBuild() || isReleaseCandidateBuild()) {
      buildTypeEnv = BuildTypeEnv.ProdFlask;
    } else if (isDevOrTestBuild()) {
      buildTypeEnv = BuildTypeEnv.DevFlask;
    } else {
      buildTypeEnv = BuildTypeEnv.UatFlask;
    }
  } else if (buildType === 'beta') {
    if (isProductionBuild() || isReleaseCandidateBuild()) {
      // for the beta build on the production or release candidate environment,
      // we use the production OAuth config.
      buildTypeEnv = BuildTypeEnv.Beta;
    } else {
      // for the beta build on the UAT environment (and feature PRs),
      // we use the UAT OAuth config.
      buildTypeEnv = BuildTypeEnv.UatBeta;
    }
  }

  return OauthConfigMap[buildTypeEnv];
}
