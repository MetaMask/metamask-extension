import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getUserStorageControllerInitMessenger,
  getUserStorageControllerMessenger,
} from './user-storage-controller-messenger';

describe('getUserStorageControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const userStorageControllerMessenger =
      getUserStorageControllerMessenger(messenger);

    expect(userStorageControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getUserStorageControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const userStorageControllerInitMessenger =
      getUserStorageControllerInitMessenger(messenger);

    expect(userStorageControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
