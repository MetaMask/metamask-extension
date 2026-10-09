import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
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

export type RewardsMoneyControllerGetStateAction = ControllerGetStateAction<
  typeof REWARDS_MONEY_CONTROLLER_NAME,
  RewardsMoneyControllerState
>;

export type RewardsMoneyControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof REWARDS_MONEY_CONTROLLER_NAME,
  RewardsMoneyControllerState
>;

export type RewardsMoneyControllerMessenger = Messenger<
  typeof REWARDS_MONEY_CONTROLLER_NAME,
  | RewardsMoneyControllerGetStateAction
  | RewardsMoneyControllerMethodActions
  | RewardsMoneyControllerAllowedActions,
  RewardsMoneyControllerStateChangeEvent
>;
