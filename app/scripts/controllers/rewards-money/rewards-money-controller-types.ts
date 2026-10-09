import { Messenger } from '@metamask/messenger';
import { AuthenticationControllerGetSessionProfileAction } from '@metamask/profile-sync-controller/auth';
import type {
  RewardsMoneyDataServiceGetRebateQuoteAction,
  RewardsMoneyDataServiceGetReferralMeAction,
  RewardsMoneyDataServiceRegisterRefereeAction,
  RewardsMoneyDataServiceValidateReferralCodeAction,
} from './rewards-money-data-service-method-action-types';
import { RewardsMoneyControllerMethodActions } from './rewards-money-controller-method-action-types';

export const REWARDS_MONEY_CONTROLLER_NAME = 'RewardsMoneyController' as const;

export const REFERRAL_ME_CACHE_THRESHOLD_MS = 300_000;

export type RewardsMoneyControllerState = {
  excludedRegions: string[] | null;
};

export type RewardsMoneyControllerAllowedActions =
  | RewardsMoneyDataServiceGetReferralMeAction
  | RewardsMoneyDataServiceValidateReferralCodeAction
  | RewardsMoneyDataServiceRegisterRefereeAction
  | RewardsMoneyDataServiceGetRebateQuoteAction
  | AuthenticationControllerGetSessionProfileAction;

export type RewardsMoneyControllerMessenger = Messenger<
  typeof REWARDS_MONEY_CONTROLLER_NAME,
  RewardsMoneyControllerMethodActions | RewardsMoneyControllerAllowedActions,
  never
>;
