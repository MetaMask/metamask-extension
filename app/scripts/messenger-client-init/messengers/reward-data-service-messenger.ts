import { Messenger, MessengerActions } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { RewardsDataServiceMessenger } from '../../controllers/rewards/rewards-data-service-types';
/**
 * Get a messenger restricted to the actions and events that the
 * rewards data service is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getRewardsDataServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<RewardsDataServiceMessenger>,
    never
  >,
) {
  const serviceMessenger: RewardsDataServiceMessenger = new Messenger({
    namespace: 'RewardsDataService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['PreferencesController:getState'],
  });
  return serviceMessenger;
}
