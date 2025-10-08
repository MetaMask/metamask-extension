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
import {
  RewardsDataServiceGetPointsEventsAction,
  RewardsDataServiceGetPointsEventsLastUpdatedAction,
  RewardsDataServiceGetOptInStatusAction,
  RewardsDataServiceGetActivePointsBoostsAction,
  RewardsDataServiceGetUnlockedRewardsAction,
  RewardsDataServiceClaimRewardAction,
  RewardsDataServiceGetPerpsDiscountAction,
  RewardsDataServiceEstimatePointsAction,
  RewardsDataServiceFetchGeoLocationAction,
  RewardsDataServiceGetReferralDetailsAction,
  RewardsDataServiceGetSeasonStatusAction,
  RewardsDataServiceLoginAction,
  RewardsDataServiceLogoutAction,
  RewardsDataServiceMobileJoinAction,
  RewardsDataServiceMobileOptinAction,
  RewardsDataServiceOptOutAction,
  RewardsDataServiceValidateReferralCodeAction,
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
  | RewardsDataServiceGetPointsEventsAction
  | RewardsDataServiceGetPointsEventsLastUpdatedAction
  | RewardsDataServiceEstimatePointsAction
  | RewardsDataServiceGetPerpsDiscountAction
  | RewardsDataServiceGetSeasonStatusAction
  | RewardsDataServiceGetReferralDetailsAction
  | RewardsDataServiceMobileOptinAction
  | RewardsDataServiceLogoutAction
  | RewardsDataServiceFetchGeoLocationAction
  | RewardsDataServiceValidateReferralCodeAction
  | RewardsDataServiceMobileJoinAction
  | RewardsDataServiceGetOptInStatusAction
  | RewardsDataServiceOptOutAction
  | RewardsDataServiceGetActivePointsBoostsAction
  | RewardsDataServiceGetUnlockedRewardsAction
  | RewardsDataServiceClaimRewardAction;

// Don't reexport as per guidelines
type AllowedEvents =
  | AccountsControllerSelectedAccountChangeEvent
  | KeyringControllerUnlockEvent;

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
      'AccountsController:listMultichainAccounts',
      'KeyringController:signPersonalMessage',
      'RewardsDataService:login',
      'RewardsDataService:getPointsEvents',
      'RewardsDataService:getPointsEventsLastUpdated',
      'RewardsDataService:estimatePoints',
      'RewardsDataService:getPerpsDiscount',
      'RewardsDataService:getSeasonStatus',
      'RewardsDataService:getReferralDetails',
      'RewardsDataService:mobileOptin',
      'RewardsDataService:logout',
      'RewardsDataService:fetchGeoLocation',
      'RewardsDataService:validateReferralCode',
      'RewardsDataService:mobileJoin',
      'RewardsDataService:getOptInStatus',
      'RewardsDataService:optOut',
      'RewardsDataService:getActivePointsBoosts',
      'RewardsDataService:getUnlockedRewards',
      'RewardsDataService:claimReward',
    ],
    allowedEvents: [
      'AccountsController:selectedAccountChange',
      'KeyringController:unlock',
    ],
  });
}
