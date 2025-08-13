import {
  SeedlessOnboardingController,
  SeedlessOnboardingControllerMessenger,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { EncryptionKey, EncryptionResult } from '@metamask/browser-passworder';
import { ControllerInitFunction } from '../types';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { isDevOrTestBuild } from '../../services/oauth/config';

const loadWeb3AuthNetwork = (): Web3AuthNetwork => {
  return isDevOrTestBuild() ? Web3AuthNetwork.Devnet : Web3AuthNetwork.Mainnet;
};

export const SeedlessOnboardingControllerInit: ControllerInitFunction<
  SeedlessOnboardingController<EncryptionKey>,
  SeedlessOnboardingControllerMessenger
> = (request) => {
  const {
    controllerMessenger,
    persistedState,
    refreshOAuthToken,
    revokeAndGetNewRefreshToken,
  } = request;

  const encryptor = encryptorFactory(600_000);

  const network = loadWeb3AuthNetwork();

  const controller = new SeedlessOnboardingController({
    messenger: controllerMessenger,
    state: persistedState.SeedlessOnboardingController,
    network,
    passwordOutdatedCacheTTL: 15_000, // 15 seconds
    refreshJWTToken: refreshOAuthToken,
    revokeRefreshToken: revokeAndGetNewRefreshToken,
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
