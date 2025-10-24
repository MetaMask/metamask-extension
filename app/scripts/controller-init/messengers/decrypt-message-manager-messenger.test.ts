import { Messenger } from '@metamask/messenger';
import { getDecryptMessageManagerMessenger } from './decrypt-message-manager-messenger';
import { getRootMessenger } from '../../lib/messenger';

describe('getDecryptMessageManagerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const decryptMessageManagerMessenger =
      getDecryptMessageManagerMessenger(messenger);

    expect(decryptMessageManagerMessenger).toBeInstanceOf(Messenger);
  });
});
