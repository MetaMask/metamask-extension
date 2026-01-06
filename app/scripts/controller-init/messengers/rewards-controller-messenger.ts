import { ControllerGetStateAction } from '@metamask/base-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';

import {
  AccountsControllerGetSelectedMultichainAccountAction,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import {
  KeyringControllerSignPersonalMessageAction,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import {
  RewardsDataServiceGetOptInStatusAction,
  RewardsDataServiceEstimatePointsAction,
  RewardsDataServiceGetSeasonStatusAction,
  RewardsDataServiceLoginAction,
  RewardsDataServiceMobileJoinAction,
  RewardsDataServiceMobileOptinAction,
  RewardsDataServiceValidateReferralCodeAction,
  RewardsDataServiceFetchGeoLocationAction,
  RewardsDataServiceGetSeasonMetadataAction,
  RewardsDataServiceGetDiscoverSeasonsAction,
} from '../../controllers/rewards/rewards-data-service-types';
import {
  RewardsControllerState,
  Patch,
  RewardsControllerAccountLinkedEvent,
  RewardsControllerOptInAction,
  RewardsControllerGetOptInStatusAction,
  RewardsControllerEstimatePointsAction,
  RewardsControllerIsRewardsFeatureEnabledAction,
  RewardsControllerValidateReferralCodeAction,
  RewardsControllerIsOptInSupportedAction,
  RewardsControllerLinkAccountToSubscriptionAction,
  RewardsControllerLinkAccountsToSubscriptionCandidateAction,
  RewardsControllerGetGeoRewardsMetadataAction,
  RewardsControllerGetCandidateSubscriptionIdAction,
  RewardsControllerGetHasAccountOptedInAction,
  RewardsControllerGetActualSubscriptionIdAction,
  RewardsControllerGetSeasonMetadataAction,
  RewardsControllerGetSeasonStatusAction,
} from '../../controllers/rewards/rewards-controller.types';
import { RootMessenger } from '../../lib/messenger';

const name = 'RewardsController';

/**
 * Events that can be emitted by the RewardsController
 */
export type RewardsControllerEvents =
  | {
      type: 'RewardsController:stateChange';
      payload: [RewardsControllerState, Patch[]];
    }
  | RewardsControllerAccountLinkedEvent;

/**
 * Actions that can be performed by the RewardsController
 */
export type RewardsControllerActions =
  | ControllerGetStateAction<'RewardsController', RewardsControllerState>
  | RewardsControllerGetOptInStatusAction
  | RewardsControllerEstimatePointsAction
  | RewardsControllerIsRewardsFeatureEnabledAction
  | RewardsControllerOptInAction
  | RewardsControllerGetGeoRewardsMetadataAction
  | RewardsControllerValidateReferralCodeAction
  | RewardsControllerIsOptInSupportedAction
  | RewardsControllerLinkAccountToSubscriptionAction
  | RewardsControllerLinkAccountsToSubscriptionCandidateAction
  | RewardsControllerGetCandidateSubscriptionIdAction
  | RewardsControllerGetHasAccountOptedInAction
  | RewardsControllerGetActualSubscriptionIdAction
  | RewardsControllerGetSeasonMetadataAction
  | RewardsControllerGetSeasonStatusAction;

// Don't reexport as per guidelines
type AllowedActions =
  | AccountsControllerGetSelectedMultichainAccountAction
  | AccountsControllerListMultichainAccountsAction
  | KeyringControllerSignPersonalMessageAction
  | RewardsDataServiceLoginAction
  | RewardsDataServiceEstimatePointsAction
  | RewardsDataServiceGetSeasonStatusAction
  | RewardsDataServiceFetchGeoLocationAction
  | RewardsDataServiceMobileOptinAction
  | RewardsDataServiceValidateReferralCodeAction
  | RewardsDataServiceMobileJoinAction
  | RewardsDataServiceGetOptInStatusAction
  | RewardsDataServiceGetSeasonMetadataAction
  | RewardsDataServiceGetDiscoverSeasonsAction
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | HandleSnapRequest;

type AllowedEvents =
  | KeyringControllerUnlockEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type RewardsControllerMessenger = Messenger<
  typeof name,
  RewardsControllerActions | AllowedActions,
  RewardsControllerEvents | AllowedEvents
>;

export function getRewardsControllerMessenger(
  messenger: RootMessenger<
    RewardsControllerActions | AllowedActions,
    RewardsControllerEvents | AllowedEvents
  >,
): RewardsControllerMessenger {
  const controllerMessenger = new Messenger<
    typeof name,
    MessengerActions<RewardsControllerMessenger>,
    MessengerEvents<RewardsControllerMessenger>,
    typeof messenger
  >({
    namespace: name,
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
      'RewardsDataService:estimatePoints',
      'RewardsDataService:getSeasonStatus',
      'RewardsDataService:fetchGeoLocation',
      'RewardsDataService:mobileOptin',
      'RewardsDataService:validateReferralCode',
      'RewardsDataService:mobileJoin',
      'RewardsDataService:getOptInStatus',
      'RewardsDataService:getSeasonMetadata',
      'RewardsDataService:getDiscoverSeasons',
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
  | RemoteFeatureFlagControllerGetStateAction
  | PreferencesControllerGetStateAction;

export type RewardsControllerInitMessenger = ReturnType<
  typeof getRewardsControllerInitMessenger
>;

export function getRewardsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'RewardsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'RewardsControllerInit',
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
