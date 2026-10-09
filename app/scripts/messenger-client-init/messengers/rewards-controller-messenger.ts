import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';

import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';

import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

import { RootMessenger } from '../../lib/messenger';
import { RewardsControllerMessenger } from '../../controllers/rewards/rewards-controller.types';

export function getRewardsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<RewardsControllerMessenger>,
    MessengerEvents<RewardsControllerMessenger>
  >,
): RewardsControllerMessenger {
  const controllerMessenger: RewardsControllerMessenger = new Messenger({
    namespace: 'RewardsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getSelectedMultichainAccount',
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'AccountsController:listMultichainAccounts',
      'KeyringController:signPersonalMessage',
      'RewardsDataService:login',
      'RewardsDataService:siweLogin',
      'RewardsDataService:estimatePoints',
      'RewardsDataService:getSeasonStatus',
      'RewardsDataService:fetchGeoLocation',
      'RewardsDataService:mobileOptin',
      'RewardsDataService:validateReferralCode',
      'RewardsDataService:mobileJoin',
      'RewardsDataService:siweJoin',
      'RewardsDataService:getOptInStatus',
      'RewardsDataService:getSeasonMetadata',
      'RewardsDataService:getDiscoverSeasons',
      'RewardsDataService:generateChallenge',
      'RewardsDataService:getVipFees',
      'SnapController:handleRequest',
    ],
    events: [
      'AccountTreeController:selectedAccountGroupChange',
      'KeyringController:unlock',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | OnboardingControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedInitializationEvents = OnboardingControllerStateChangeEvent;

export type RewardsControllerInitMessenger = ReturnType<
  typeof getRewardsControllerInitMessenger
>;

export function getRewardsControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'RewardsControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'RewardsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'OnboardingController:getState',
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
    events: ['OnboardingController:stateChange'],
  });
  return controllerInitMessenger;
}
