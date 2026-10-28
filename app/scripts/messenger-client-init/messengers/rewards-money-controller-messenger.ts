import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { RewardsMoneyControllerMessenger } from '../../controllers/rewards-money/rewards-money-controller-types';
import { RootMessenger } from '../../lib/messenger';

/**
 * Messenger for the Rewards Money controller.
 *
 * @param messenger - The root messenger.
 * @returns The restricted controller messenger.
 */
export function getRewardsMoneyControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<RewardsMoneyControllerMessenger>,
    MessengerEvents<RewardsMoneyControllerMessenger>
  >,
): RewardsMoneyControllerMessenger {
  const controllerMessenger: RewardsMoneyControllerMessenger = new Messenger({
    namespace: 'RewardsMoneyController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'RewardsMoneyDataService:getReferralMe',
      'RewardsMoneyDataService:validateReferralCode',
      'RewardsMoneyDataService:registerReferee',
      'RewardsMoneyDataService:getRebateQuote',
      'AuthenticationController:getSessionProfile',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | PreferencesControllerGetStateAction;

export type RewardsMoneyControllerInitMessenger = ReturnType<
  typeof getRewardsMoneyControllerInitMessenger
>;

/**
 * Init messenger used to read the Rewards Money feature flag and whether
 * external services are enabled.
 *
 * @param messenger - The root messenger.
 * @returns The init messenger.
 */
export function getRewardsMoneyControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'RewardsMoneyControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'RewardsMoneyControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
  });
  return controllerInitMessenger;
}
