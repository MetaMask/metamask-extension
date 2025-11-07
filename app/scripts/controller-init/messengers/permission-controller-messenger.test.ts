import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getPermissionControllerInitMessenger,
  getPermissionControllerMessenger,
} from './permission-controller-messenger';

describe('getPermissionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const PermissionControllerMessenger =
      getPermissionControllerMessenger(messenger);

    expect(PermissionControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getPermissionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const PermissionControllerInitMessenger =
      getPermissionControllerInitMessenger(messenger);

    expect(PermissionControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
