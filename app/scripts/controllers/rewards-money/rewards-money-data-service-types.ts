import { Messenger } from '@metamask/messenger';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import { PreferencesControllerGetStateAction } from '../preferences-controller';
import { RewardsMoneyDataServiceMethodActions } from './rewards-money-data-service-method-action-types';

export const REWARDS_MONEY_DATA_SERVICE_NAME =
  'RewardsMoneyDataService' as const;

export type RewardsMoneyDataServiceMessenger = Messenger<
  typeof REWARDS_MONEY_DATA_SERVICE_NAME,
  RewardsMoneyDataServiceMethodActions | RewardsMoneyDataServiceAllowedActions,
  never
>;

type RewardsMoneyDataServiceAllowedActions =
  | AuthenticationControllerGetBearerTokenAction
  | PreferencesControllerGetStateAction;
