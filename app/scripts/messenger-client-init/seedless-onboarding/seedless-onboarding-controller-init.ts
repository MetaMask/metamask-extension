import {
  SeedlessOnboardingController,
  SeedlessOnboardingControllerMessenger,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { EncryptionKey } from '@metamask/browser-passworder';
import { getEnvUrls } from '@metamask/profile-sync-controller/sdk';
import { MessengerClientInitFunction } from '../types';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { isDevOrTestBuild } from '../../services/oauth/config';
import { SeedlessOnboardingControllerInitMessenger } from '../messengers/seedless-onboarding';
import { getProfileSyncEnv } from '../../services/oauth/oidc';

const AUTH_SERVER_PROFILE_PAIR_PATH = '/api/v2/profile/pair';

const loadWeb3AuthNetwork = (): Web3AuthNetwork => {
  return isDevOrTestBuild() ? Web3AuthNetwork.Devnet : Web3AuthNetwork.Mainnet;
};

export const SeedlessOnboardingControllerInit: MessengerClientInitFunction<
  SeedlessOnboardingController<EncryptionKey>,
  // @ts-expect-error - BaseControllerMessenger version mismatch
  SeedlessOnboardingControllerMessenger,
  SeedlessOnboardingControllerInitMessenger
> = (request) => {
  const { initMessenger, controllerMessenger, persistedState } = request;

  const encryptor = encryptorFactory(600_000);

  const network = loadWeb3AuthNetwork();

  const profileSyncEnv = getProfileSyncEnv();

  const messengerClient = new SeedlessOnboardingController<
    CryptoKey | EncryptionKey
  >({
    messenger: controllerMessenger,
    state: persistedState.SeedlessOnboardingController,
    network,
    passwordOutdatedCacheTTL: 15_000, // 15 seconds
    profilePairingEndpoint: `${getEnvUrls(profileSyncEnv).authApiUrl}${AUTH_SERVER_PROFILE_PAIR_PATH}`,
    fetchFunction: fetch,

    // This is a temporary workaround to allow the OAuthService to be used
    // in the seedless onboarding controller. Ideally the controller calls the
    // service directly using the messenger system, but that requires some
    // further refactoring in the controller.
    refreshJWTToken: (...args) =>
      initMessenger.call('OAuthService:getNewRefreshToken', ...args),
    revokeRefreshToken: (...args) =>
      initMessenger.call('OAuthService:revokeRefreshToken', ...args),
    renewRefreshToken: (...args) =>
      initMessenger.call('OAuthService:renewRefreshToken', ...args),

    encryptor,
  });

  return {
    messengerClient,
  };
};
