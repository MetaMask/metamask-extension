import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getPermissionLogControllerMessenger } from './permission-log-controller-messenger';

describe('getPermissionLogControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const PermissionLogControllerMessenger =
      getPermissionLogControllerMessenger(messenger);

    expect(PermissionLogControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
