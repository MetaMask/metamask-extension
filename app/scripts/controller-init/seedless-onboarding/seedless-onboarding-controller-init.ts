import {
  SeedlessOnboardingController,
  SeedlessOnboardingControllerMessenger,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { EncryptionKey, EncryptionResult } from '@metamask/browser-passworder';
import { ControllerInitFunction } from '../types';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { isProduction } from '../../../../shared/modules/environment';
import { ENVIRONMENT } from '../../../../development/build/constants';

const loadWeb3AuthNetwork = (): Web3AuthNetwork => {
  let network = Web3AuthNetwork.Devnet;
  if (process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.OTHER) {
    network = Web3AuthNetwork.Devnet;
  } else if (isProduction()) {
    network = Web3AuthNetwork.Mainnet;
  }
  return network;
};

export const SeedlessOnboardingControllerInit: ControllerInitFunction<
  SeedlessOnboardingController<EncryptionKey>,
  SeedlessOnboardingControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const encryptor = encryptorFactory(600_000);

  const network = loadWeb3AuthNetwork();

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
