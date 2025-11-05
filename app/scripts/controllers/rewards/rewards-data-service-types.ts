/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { RewardsDataService } from './rewards-data-service';

const SERVICE_NAME = 'RewardsDataService';

// Auth endpoint action types

export interface RewardsDataServiceLoginAction {
  type: `${typeof SERVICE_NAME}:login`;
  handler: RewardsDataService['login'];
}

export interface RewardsDataServiceEstimatePointsAction {
  type: `${typeof SERVICE_NAME}:estimatePoints`;
  handler: RewardsDataService['estimatePoints'];
}

export interface RewardsDataServiceMobileOptinAction {
  type: `${typeof SERVICE_NAME}:mobileOptin`;
  handler: RewardsDataService['mobileOptin'];
}

export interface RewardsDataServiceGetSeasonStatusAction {
  type: `${typeof SERVICE_NAME}:getSeasonStatus`;
  handler: RewardsDataService['getSeasonStatus'];
}

export interface RewardsDataServiceFetchGeoLocationAction {
  type: `${typeof SERVICE_NAME}:fetchGeoLocation`;
  handler: RewardsDataService['fetchGeoLocation'];
}

export interface RewardsDataServiceValidateReferralCodeAction {
  type: `${typeof SERVICE_NAME}:validateReferralCode`;
  handler: RewardsDataService['validateReferralCode'];
}

export interface RewardsDataServiceMobileJoinAction {
  type: `${typeof SERVICE_NAME}:mobileJoin`;
  handler: RewardsDataService['mobileJoin'];
}

export interface RewardsDataServiceGetOptInStatusAction {
  type: `${typeof SERVICE_NAME}:getOptInStatus`;
  handler: RewardsDataService['getOptInStatus'];
}

export interface RewardsDataServiceGetSeasonMetadataAction {
  type: `${typeof SERVICE_NAME}:getSeasonMetadata`;
  handler: RewardsDataService['getSeasonMetadata'];
}

export interface RewardsDataServiceGetDiscoverSeasonsAction {
  type: `${typeof SERVICE_NAME}:getDiscoverSeasons`;
  handler: RewardsDataService['getDiscoverSeasons'];
}

export type RewardsDataServiceActions =
  | RewardsDataServiceLoginAction
  | RewardsDataServiceEstimatePointsAction
  | RewardsDataServiceGetSeasonStatusAction
  | RewardsDataServiceFetchGeoLocationAction
  | RewardsDataServiceMobileOptinAction
  | RewardsDataServiceValidateReferralCodeAction
  | RewardsDataServiceMobileJoinAction
  | RewardsDataServiceGetOptInStatusAction
  | RewardsDataServiceGetSeasonMetadataAction
  | RewardsDataServiceGetDiscoverSeasonsAction;
