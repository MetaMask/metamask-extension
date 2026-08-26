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

  it('delegates the keyring action the address derivation needs', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountUpgradeServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: ['KeyringController:withKeyringUnsafe'],
      }),
    );
  });
});
