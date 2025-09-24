import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getPermissionControllerInitMessenger,
  getPermissionControllerMessenger,
} from './permission-controller-messenger';

describe('getPermissionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const PermissionControllerMessenger =
      getPermissionControllerMessenger(messenger);

    expect(PermissionControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getPermissionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const PermissionControllerInitMessenger =
      getPermissionControllerInitMessenger(messenger);

    expect(PermissionControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
