import { Messenger } from '@metamask/base-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

type AllowedActions = PreferencesControllerGetStateAction;

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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'RewardsDataService',
    allowedActions: ['PreferencesController:getState'],
    allowedEvents: [],
  });
}
