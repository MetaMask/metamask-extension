import { Messenger } from '@metamask/messenger';
import { getPermissionLogControllerMessenger } from './permission-log-controller-messenger';
import { getRootMessenger } from '.';

describe('getPermissionLogControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const PermissionLogControllerMessenger =
      getPermissionLogControllerMessenger(messenger);

    expect(PermissionLogControllerMessenger).toBeInstanceOf(Messenger);
  });
});
