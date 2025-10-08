import { Messenger, RestrictedMessenger } from '@metamask/base-controller';

import {
  KeyringControllerSignPersonalMessageAction,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';

import {
  AccountsControllerGetSelectedMultichainAccountAction,
  AccountsControllerSelectedAccountChangeEvent,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
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
} from '../../controllers/rewards/rewards-data-service';
import {
  RewardsControllerActions,
  RewardsControllerEvents,
} from '../../controllers/rewards/rewards-controller.types';

const name = 'RewardsController';

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

// Don't reexport as per guidelines
type AllowedEvents =
  | AccountsControllerSelectedAccountChangeEvent
  | KeyringControllerUnlockEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type RewardsControllerMessenger = RestrictedMessenger<
  typeof name,
  RewardsControllerActions | AllowedActions,
  RewardsControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type'] // ← This was wrong!
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

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type RewardsControllerInitMessenger = ReturnType<
  typeof getRewardsControllerInitMessenger
>;

export function getRewardsControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'RewardsControllerInit',
    allowedActions: ['RemoteFeatureFlagController:getState'],
    allowedEvents: [],
  });
}
