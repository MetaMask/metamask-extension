import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getEncryptionPublicKeyControllerInitMessenger,
  getEncryptionPublicKeyControllerMessenger,
} from './encryption-public-key-controller-messenger';

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
