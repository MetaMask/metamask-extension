import { Messenger } from '@metamask/messenger';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import type { RewardsDataServiceActions } from '../../controllers/rewards/rewards-data-service-types';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | RewardsDataServiceActions
  | PreferencesControllerGetStateAction;

type AllowedEvents = never;

export type RewardsDataServiceMessenger = ReturnType<
  typeof getRewardsDataServiceMessenger
>;

/**
 * Get a messenger restricted to the actions and events that the
 * rewards data service is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getRewardsDataServiceMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const serviceMessenger = new Messenger<
    'RewardsDataService',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'RewardsDataService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['PreferencesController:getState'],
  });
  return serviceMessenger;
}
