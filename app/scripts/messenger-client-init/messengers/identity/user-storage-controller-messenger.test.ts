import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getUserStorageControllerInitMessenger,
  getUserStorageControllerMessenger,
} from './user-storage-controller-messenger';

describe('getUserStorageControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');
    const userStorageControllerMessenger =
      getUserStorageControllerMessenger(messenger);

    expect(userStorageControllerMessenger).toBeInstanceOf(Messenger);
    expect(delegateSpy.mock.calls[0][0].actions).toMatchInlineSnapshot(`
      [
        "KeyringController:getState",
        "KeyringController:withKeyringV2Unsafe",
        "AuthenticationController:getBearerToken",
        "AuthenticationController:getSessionProfile",
        "AuthenticationController:isSignedIn",
        "AuthenticationController:performSignIn",
        "AddressBookController:list",
        "AddressBookController:set",
        "AddressBookController:delete",
      ]
    `);
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
