import { Messenger } from '@metamask/messenger';
import {
  getEncryptionPublicKeyControllerInitMessenger,
  getEncryptionPublicKeyControllerMessenger,
} from './encryption-public-key-controller-messenger';
import { getRootMessenger } from '.';

describe('getEncryptionPublicKeyControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const encryptionPublicKeyControllerMessenger =
      getEncryptionPublicKeyControllerMessenger(messenger);

    expect(encryptionPublicKeyControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getEncryptionPublicKeyControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const encryptionPublicKeyControllerInitMessenger =
      getEncryptionPublicKeyControllerInitMessenger(messenger);

    expect(encryptionPublicKeyControllerInitMessenger).toBeInstanceOf(
      Messenger,
    );
  });
});
