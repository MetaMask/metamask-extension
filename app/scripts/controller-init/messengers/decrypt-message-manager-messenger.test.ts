import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getDecryptMessageManagerMessenger } from './decrypt-message-manager-messenger';

describe('getDecryptMessageManagerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const decryptMessageManagerMessenger =
      getDecryptMessageManagerMessenger(messenger);

    expect(decryptMessageManagerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
