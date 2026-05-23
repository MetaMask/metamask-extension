import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getDecryptMessageControllerInitMessenger,
  getDecryptMessageControllerMessenger,
} from './decrypt-message-controller-messenger';

describe('getDecryptMessageControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const decryptMessageControllerMessenger =
      getDecryptMessageControllerMessenger(messenger);

    expect(decryptMessageControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getDecryptMessageControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const decryptMessageControllerInitMessenger =
      getDecryptMessageControllerInitMessenger(messenger);

    expect(decryptMessageControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
