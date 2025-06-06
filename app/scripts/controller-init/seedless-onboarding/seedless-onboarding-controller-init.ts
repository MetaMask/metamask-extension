import {
  SeedlessOnboardingController,
  SeedlessOnboardingControllerMessenger,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { EncryptionKey, EncryptionResult } from '@metamask/browser-passworder';
import { ControllerInitFunction } from '../types';
import { encryptorFactory } from '../../lib/encryptor-factory';

export const SeedlessOnboardingControllerInit: ControllerInitFunction<
  SeedlessOnboardingController<EncryptionKey>,
  SeedlessOnboardingControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const encryptor = encryptorFactory(600_000);

  const network = process.env.WEB3AUTH_NETWORK as Web3AuthNetwork;
  if (!process.env.IN_TEST && !network) {
    throw new Error('WEB3AUTH_NETWORK is not set in the environment');
  }

  const controller = new SeedlessOnboardingController({
    messenger: controllerMessenger,
    state: persistedState.SeedlessOnboardingController,
    network,
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
