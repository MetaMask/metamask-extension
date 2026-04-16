import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAuthenticationControllerInitMessenger,
  getAuthenticationControllerMessenger,
} from './authentication-controller-messenger';

describe('getAuthenticationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const authenticationControllerMessenger =
      getAuthenticationControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getAuthenticationControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const authenticationControllerInitMessenger =
      getAuthenticationControllerInitMessenger(messenger);

    expect(authenticationControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
