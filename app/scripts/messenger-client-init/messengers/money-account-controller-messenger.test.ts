import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getMoneyAccountControllerInitMessenger,
  getMoneyAccountControllerMessenger,
} from './money-account-controller-messenger';

describe('getMoneyAccountControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getMoneyAccountControllerMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the KeyringController actions the controller needs', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'KeyringController:getState',
          'KeyringController:addNewKeyring',
          'KeyringController:withKeyring',
        ],
        events: [],
      }),
    );
  });
});

describe('getMoneyAccountControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getMoneyAccountControllerInitMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the flag and keyring state the creation gate reads', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'KeyringController:getState',
          'RemoteFeatureFlagController:getState',
        ],
        events: [
          'KeyringController:stateChange',
          'RemoteFeatureFlagController:stateChange',
        ],
      }),
    );
  });
});
