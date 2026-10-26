import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountBalanceServiceMessenger } from '@metamask/money-account-balance-service';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountBalanceService, scoped to the actions
 * and events the service is allowed to use.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountBalanceService messenger.
 */
export function getMoneyAccountBalanceServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountBalanceServiceMessenger>,
    MessengerEvents<MoneyAccountBalanceServiceMessenger>
  >,
): MoneyAccountBalanceServiceMessenger {
  const serviceMessenger: MoneyAccountBalanceServiceMessenger = new Messenger({
    namespace: 'MoneyAccountBalanceService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'NetworkController:getNetworkConfigurationByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'MoneyAccountApiDataService:fetchPositions',
    ],
    events: ['RemoteFeatureFlagController:stateChange'],
  });

  return serviceMessenger;
}
