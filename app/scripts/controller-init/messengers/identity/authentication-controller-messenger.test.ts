import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getAuthenticationControllerInitMessenger,
  getAuthenticationControllerMessenger,
} from './authentication-controller-messenger';

describe('getAuthenticationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const authenticationControllerMessenger =
      getAuthenticationControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getAuthenticationControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const authenticationControllerInitMessenger =
      getAuthenticationControllerInitMessenger(messenger);

    expect(authenticationControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
