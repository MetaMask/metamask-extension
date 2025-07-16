import { Web3AuthNetwork } from '@metamask/seedless-onboarding-controller';
import { isProduction } from '../../../../shared/modules/environment';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { OAuthConfig } from './types';

export enum BuildTypeEnv {
  DevMain = 'DevMain',
  DevFlask = 'DevFlask',
  UatMain = 'UatMain',
  UatFlask = 'UatFlask',
  ProdMain = 'ProdMain',
  ProdFlask = 'ProdFlask',
  Beta = 'Beta',
}

export const OauthConfigMap: Record<BuildTypeEnv, OAuthConfig> = {
  [BuildTypeEnv.DevMain]: {
    googleAuthConnectionId: 'mm-google-dev-extension',
    appleAuthConnectionId: 'mm-apple-dev-common',
    googleGrouppedAuthConnectionId: 'mm-google-dev',
    appleGrouppedAuthConnectionId: 'mm-apple-dev',
    authServerUrl: 'https://auth-service.dev-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
  },
  [BuildTypeEnv.DevFlask]: {
    googleAuthConnectionId: 'mm-google-flask-dev-extension',
    appleAuthConnectionId: 'mm-apple-flask-dev-common',
    googleGrouppedAuthConnectionId: 'mm-google-flask-dev',
    appleGrouppedAuthConnectionId: 'mm-apple-flask-dev',
    authServerUrl: 'https://auth-service.dev-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
  },
  [BuildTypeEnv.UatMain]: {
    googleAuthConnectionId: 'mm-google-uat-extension',
    appleAuthConnectionId: 'mm-apple-uat-common',
    googleGrouppedAuthConnectionId: 'mm-google-uat',
    appleGrouppedAuthConnectionId: 'mm-apple-uat',
    authServerUrl: 'https://auth-service.uat-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
  },
  [BuildTypeEnv.UatFlask]: {
    googleAuthConnectionId: 'mm-google-flask-uat-extension',
    appleAuthConnectionId: 'mm-apple-flask-uat-common',
    googleGrouppedAuthConnectionId: 'mm-google-flask-uat',
    appleGrouppedAuthConnectionId: 'mm-apple-flask-uat',
    authServerUrl: 'https://auth-service.uat-api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Devnet,
  },
  [BuildTypeEnv.ProdMain]: {
    googleAuthConnectionId: 'mm-google-main-extension',
    appleAuthConnectionId: 'mm-apple-main-extension',
    googleGrouppedAuthConnectionId: 'mm-google-main',
    appleGrouppedAuthConnectionId: 'mm-apple-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
  [BuildTypeEnv.ProdFlask]: {
    googleAuthConnectionId: 'mm-google-flask-main-extension',
    appleAuthConnectionId: 'mm-apple-flask-main-extension',
    googleGrouppedAuthConnectionId: 'mm-google-flask-main',
    appleGrouppedAuthConnectionId: 'mm-apple-flask-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
  [BuildTypeEnv.Beta]: {
    googleAuthConnectionId: 'mm-google-flask-main-extension',
    appleAuthConnectionId: 'mm-apple-flask-main-extension',
    googleGrouppedAuthConnectionId: 'mm-google-flask-main',
    appleGrouppedAuthConnectionId: 'mm-apple-flask-main',
    authServerUrl: 'https://auth-service.api.cx.metamask.io',
    web3AuthNetwork: Web3AuthNetwork.Mainnet,
  },
};

export function isUatBuild() {
  // we gonna use `yarn dist` builds as uat builds
  return process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.OTHER;
}

export function loadOAuthConfig(): OAuthConfig {
  const buildType = process.env.METAMASK_BUILD_TYPE;
  const environment = process.env.METAMASK_ENVIRONMENT;

  let buildTypeEnv = BuildTypeEnv.DevMain;
  if (buildType === 'main') {
    if (isUatBuild()) {
      buildTypeEnv = BuildTypeEnv.UatMain;
    } else if (isProduction()) {
      buildTypeEnv = BuildTypeEnv.ProdMain;
    } else {
      buildTypeEnv = BuildTypeEnv.DevMain;
    }
  } else if (buildType === 'flask') {
    if (isUatBuild()) {
      buildTypeEnv = BuildTypeEnv.UatFlask;
    } else if (isProduction()) {
      buildTypeEnv = BuildTypeEnv.ProdFlask;
    } else {
      buildTypeEnv = BuildTypeEnv.DevFlask;
    }
  } else if (buildType === 'beta') {
    buildTypeEnv = BuildTypeEnv.Beta;
  }

  return OauthConfigMap[buildTypeEnv];
}
