import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getDecryptMessageControllerInitMessenger,
  getDecryptMessageControllerMessenger,
} from './decrypt-message-controller-messenger';

describe('getDecryptMessageControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const decryptMessageControllerMessenger =
      getDecryptMessageControllerMessenger(messenger);

    expect(decryptMessageControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getDecryptMessageControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const decryptMessageControllerInitMessenger =
      getDecryptMessageControllerInitMessenger(messenger);

    expect(decryptMessageControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
