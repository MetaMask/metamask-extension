import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getKeyringControllerInitMessenger,
  getKeyringControllerMessenger,
} from './keyring-controller-messenger';

describe('getKeyringControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const keyringControllerMessenger = getKeyringControllerMessenger(messenger);

    expect(keyringControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getKeyringControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const keyringControllerInitMessenger =
      getKeyringControllerInitMessenger(messenger);

    expect(keyringControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
