import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getMoneyAccountUpgradeServiceMessenger } from './money-account-upgrade-service-messenger';

describe('getMoneyAccountUpgradeServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getMoneyAccountUpgradeServiceMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the state and network actions the bootstrap gate needs', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountUpgradeServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'KeyringController:getState',
          'KeyringController:withKeyringUnsafe',
          'LegacyBackgroundApiService:addNetwork',
          'NetworkController:getState',
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
