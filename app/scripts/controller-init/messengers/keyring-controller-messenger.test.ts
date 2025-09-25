import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getKeyringControllerInitMessenger,
  getKeyringControllerMessenger,
} from './keyring-controller-messenger';

describe('getKeyringControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const keyringControllerMessenger = getKeyringControllerMessenger(messenger);

    expect(keyringControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getKeyringControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const keyringControllerInitMessenger =
      getKeyringControllerInitMessenger(messenger);

    expect(keyringControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
