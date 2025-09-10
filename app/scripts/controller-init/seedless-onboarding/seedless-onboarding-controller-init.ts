import {
  SeedlessOnboardingController,
  SeedlessOnboardingControllerMessenger,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { EncryptionKey, EncryptionResult } from '@metamask/browser-passworder';
import { ControllerInitFunction } from '../types';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { isDevOrTestBuild } from '../../services/oauth/config';
import { SeedlessOnboardingControllerInitMessenger } from '../messengers/seedless-onboarding';

const loadWeb3AuthNetwork = (): Web3AuthNetwork => {
  return isDevOrTestBuild() ? Web3AuthNetwork.Devnet : Web3AuthNetwork.Mainnet;
};

export const SeedlessOnboardingControllerInit: ControllerInitFunction<
  SeedlessOnboardingController<EncryptionKey>,
  SeedlessOnboardingControllerMessenger,
  SeedlessOnboardingControllerInitMessenger
> = (request) => {
  const { initMessenger, controllerMessenger, persistedState } = request;

  const encryptor = encryptorFactory(600_000);

  const network = loadWeb3AuthNetwork();

  const controller = new SeedlessOnboardingController({
    messenger: controllerMessenger,
    state: persistedState.SeedlessOnboardingController,
    network,
    passwordOutdatedCacheTTL: 15_000, // 15 seconds

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

    encryptor: {
      decrypt: (key, encryptedData) => encryptor.decrypt(key, encryptedData),
      decryptWithDetail: (key, encryptedData) =>
        encryptor.decryptWithDetail(key, encryptedData),
      decryptWithKey(key, encryptedData) {
        let payload: EncryptionResult;
        if (typeof encryptedData === 'string') {
          payload = JSON.parse(encryptedData);
        } else {
          payload = encryptedData;
        }

        return encryptor.decryptWithKey(key as EncryptionKey, payload);
      },
      encrypt: (key, data) => encryptor.encrypt(key, data),
      encryptWithDetail: (key, data) => encryptor.encryptWithDetail(key, data),
      importKey: (key) => encryptor.importKey(key),
    },
  });

  return {
    controller,
  };
};
