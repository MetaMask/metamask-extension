import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getNameControllerInitMessenger,
  getNameControllerMessenger,
} from './name-controller-messenger';

describe('getNameControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const nameControllerMessenger = getNameControllerMessenger(messenger);

    expect(nameControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getNameControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const nameControllerInitMessenger =
      getNameControllerInitMessenger(messenger);

    expect(nameControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
