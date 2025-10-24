import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getEncryptionPublicKeyManagerMessenger } from './encryption-public-key-manager-messenger';

describe('getEncryptionPublicKeyManagerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const encryptionPublicKeyManagerMessenger =
      getEncryptionPublicKeyManagerMessenger(messenger);

    expect(encryptionPublicKeyManagerMessenger).toBeInstanceOf(Messenger);
  });
});
