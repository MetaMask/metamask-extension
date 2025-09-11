import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getTokenListControllerInitMessenger,
  getTokenListControllerMessenger,
} from './token-list-controller-messenger';

describe('getTokenListControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const controllerMessenger = getTokenListControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getTokenListControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const initMessenger = getTokenListControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
