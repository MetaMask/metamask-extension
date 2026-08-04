import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getMoneyAccountBalanceServiceMessenger } from './money-account-balance-service-messenger';

describe('getMoneyAccountBalanceServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const serviceMessenger = getMoneyAccountBalanceServiceMessenger(messenger);

    expect(serviceMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the network and remote feature flag actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountBalanceServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'NetworkController:getNetworkConfigurationByChainId',
          'NetworkController:getNetworkClientById',
          'RemoteFeatureFlagController:getState',
        ],
      }),
    );
  });

  it('delegates the remote feature flag state change event', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountBalanceServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: ['RemoteFeatureFlagController:stateChange'],
      }),
    );
  });
});
