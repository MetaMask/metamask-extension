import { Messenger, MessengerActions } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { RewardsMoneyDataServiceMessenger } from '../../controllers/rewards-money/rewards-money-data-service-types';

/**
 * Messenger for the Rewards Money data service.
 *
 * @param messenger - The root messenger.
 * @returns The restricted service messenger.
 */
export function getRewardsMoneyDataServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<RewardsMoneyDataServiceMessenger>,
    never
  >,
): RewardsMoneyDataServiceMessenger {
  const serviceMessenger: RewardsMoneyDataServiceMessenger = new Messenger({
    namespace: 'RewardsMoneyDataService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'AuthenticationController:getBearerToken',
      'PreferencesController:getState',
    ],
  });
  return serviceMessenger;
}
