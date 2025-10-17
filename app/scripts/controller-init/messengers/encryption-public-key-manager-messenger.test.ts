import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getEncryptionPublicKeyManagerMessenger } from './encryption-public-key-manager-messenger';

describe('getEncryptionPublicKeyManagerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const encryptionPublicKeyManagerMessenger =
      getEncryptionPublicKeyManagerMessenger(messenger);

    expect(encryptionPublicKeyManagerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
