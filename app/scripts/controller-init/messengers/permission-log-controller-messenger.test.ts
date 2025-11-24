import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getPermissionLogControllerMessenger } from './permission-log-controller-messenger';

describe('getPermissionLogControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const PermissionLogControllerMessenger =
      getPermissionLogControllerMessenger(messenger);

    expect(PermissionLogControllerMessenger).toBeInstanceOf(Messenger);
  });
});
