import { ControllerMessenger } from '@metamask/base-controller';
import {
  KeyringController,
  KeyringControllerState,
} from '@metamask/keyring-controller';
import { encryptorFactory } from './lib/encryptor-factory';
import type { Json } from '@metamask/utils';
import type { EthKeyring } from '@metamask/keyring-api';

type AllEvents = never;

type AllActions = never;

type MetamaskState = {
  KeyringController: KeyringControllerState;
};

export class MetamaskWallet {
  #controllerMessenger: ControllerMessenger<AllActions, AllEvents>;

  /**
   * Construct a MetaMask wallet
   */
  constructor({
    additionalKeyrings,
    state = {},
  }: {
    additionalKeyrings: {
      (): EthKeyring<Json>;
      type: string;
    }[];
    state?: Partial<MetamaskState>;
  }) {
    this.#controllerMessenger = new ControllerMessenger();

    const keyringControllerMessenger = this.#controllerMessenger.getRestricted({
      name: 'KeyringController',
    });

    const keyringController = new KeyringController({
      cacheEncryptionKey: true,
      keyringBuilders: additionalKeyrings,
      state: state.KeyringController,
      encryptor: encryptorFactory(600_000),
      messenger: keyringControllerMessenger,
    });
  }
}
