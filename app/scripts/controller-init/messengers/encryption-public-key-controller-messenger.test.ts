import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getEncryptionPublicKeyControllerInitMessenger,
  getEncryptionPublicKeyControllerMessenger,
} from './encryption-public-key-controller-messenger';

describe('getEncryptionPublicKeyControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const encryptionPublicKeyControllerMessenger =
      getEncryptionPublicKeyControllerMessenger(messenger);

    expect(encryptionPublicKeyControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getEncryptionPublicKeyControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const encryptionPublicKeyControllerInitMessenger =
      getEncryptionPublicKeyControllerInitMessenger(messenger);

    expect(encryptionPublicKeyControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
