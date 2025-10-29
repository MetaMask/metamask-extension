import {
  ControllerGetStateAction,
  Messenger,
  RestrictedMessenger,
} from '@metamask/base-controller';

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
  RewardsControllerGetFirstSubscriptionIdAction,
  RewardsControllerGetSeasonMetadataAction,
  RewardsControllerGetSeasonStatusAction,
} from '../../controllers/rewards/rewards-controller.types';

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
  | RewardsControllerGetFirstSubscriptionIdAction
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

export type RewardsControllerMessenger = RestrictedMessenger<
  typeof name,
  RewardsControllerActions | AllowedActions,
  RewardsControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

export function getRewardsControllerMessenger(
  messenger: Messenger<
    RewardsControllerActions | AllowedActions,
    RewardsControllerEvents | AllowedEvents
  >,
): RewardsControllerMessenger {
  return messenger.getRestricted({
    name,
    allowedActions: [
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
    allowedEvents: [
      'AccountTreeController:selectedAccountGroupChange',
      'KeyringController:unlock',
    ],
  });
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | PreferencesControllerGetStateAction;

export type RewardsControllerInitMessenger = ReturnType<
  typeof getRewardsControllerInitMessenger
>;

export function getRewardsControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'RewardsControllerInit',
    allowedActions: [
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
    allowedEvents: [],
  });
}
