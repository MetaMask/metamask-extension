import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getTokensControllerInitMessenger,
  getTokensControllerMessenger,
} from './tokens-controller-messenger';

describe('getTokensControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const controllerMessenger = getTokensControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getTokensControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const initMessenger = getTokensControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
