/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { RewardsDataService } from './rewards-data-service';

/**
 * Perform login via signature for the current account.
 *
 * @param body - The login request body containing account, timestamp, and signature.
 * @param body.account
 * @param body.timestamp
 * @param body.signature
 * @returns The login response DTO.
 */
export type RewardsDataServiceLoginAction = {
  type: `RewardsDataService:login`;
  handler: RewardsDataService['login'];
};

/**
 * Perform login via SIWE (Sign-In with Ethereum) signature.
 *
 * @param body - The SIWE login request body containing challengeId, signature, and optional referralCode.
 * @param body.challengeId - The unique identifier of the challenge
 * @param body.signature - The signature of the SIWE message
 * @param body.referralCode - Optional referral code provided by referrer
 * @returns The login response DTO.
 */
export type RewardsDataServiceSiweLoginAction = {
  type: `RewardsDataService:siweLogin`;
  handler: RewardsDataService['siweLogin'];
};

/**
 * Estimate points for a given activity.
 *
 * @param body - The estimate points request body.
 * @returns The estimated points response DTO.
 */
export type RewardsDataServiceEstimatePointsAction = {
  type: `RewardsDataService:estimatePoints`;
  handler: RewardsDataService['estimatePoints'];
};

/**
 * Perform optin via signature for the current account.
 *
 * @param body - The login request body containing account, timestamp, signature and referral code.
 * @returns The login response DTO.
 */
export type RewardsDataServiceMobileOptinAction = {
  type: `RewardsDataService:mobileOptin`;
  handler: RewardsDataService['mobileOptin'];
};

/**
 * Get season state for a specific season.
 *
 * @param seasonId - The ID of the season to get state for.
 * @param subscriptionToken - The subscription token for authentication.
 * @returns The season state DTO.
 */
export type RewardsDataServiceGetSeasonStatusAction = {
  type: `RewardsDataService:getSeasonStatus`;
  handler: RewardsDataService['getSeasonStatus'];
};

/**
 * Fetch geolocation information from MetaMask's geolocation service.
 * Returns location in Country or Country-Region format (e.g., 'US', 'CA-ON', 'FR').
 *
 * @returns Promise<string> - The geolocation string or 'UNKNOWN' on failure.
 */
export type RewardsDataServiceFetchGeoLocationAction = {
  type: `RewardsDataService:fetchGeoLocation`;
  handler: RewardsDataService['fetchGeoLocation'];
};

/**
 * Validate a referral code.
 *
 * @param code - The referral code to validate.
 * @returns Promise<{valid: boolean}> - Object indicating if the code is valid.
 */
export type RewardsDataServiceValidateReferralCodeAction = {
  type: `RewardsDataService:validateReferralCode`;
  handler: RewardsDataService['validateReferralCode'];
};

/**
 * Join an account to a subscription via mobile login.
 *
 * @param body - The mobile login request body containing account, timestamp, and signature.
 * @param subscriptionToken - The subscription token to join the account to.
 * @returns Promise<SubscriptionDto> - The updated subscription information.
 */
export type RewardsDataServiceMobileJoinAction = {
  type: `RewardsDataService:mobileJoin`;
  handler: RewardsDataService['mobileJoin'];
};

/**
 * Join an account to a subscription via SIWE (Sign-In with Ethereum) signature.
 *
 * @param body - The SIWE join request body containing challengeId and signature.
 * @param subscriptionToken - The subscription token to join the account to.
 * @returns Promise<SubscriptionDto> - The updated subscription information.
 */
export type RewardsDataServiceSiweJoinAction = {
  type: `RewardsDataService:siweJoin`;
  handler: RewardsDataService['siweJoin'];
};

/**
 * Get opt-in status for multiple addresses.
 *
 * @param body - The request body containing addresses to check.
 * @returns Promise<OptInStatusDto> - The opt-in status for each address.
 */
export type RewardsDataServiceGetOptInStatusAction = {
  type: `RewardsDataService:getOptInStatus`;
  handler: RewardsDataService['getOptInStatus'];
};

/**
 * Get discover seasons information (current and next season).
 *
 * @returns The discover seasons DTO with current and next season information.
 */
export type RewardsDataServiceGetDiscoverSeasonsAction = {
  type: `RewardsDataService:getDiscoverSeasons`;
  handler: RewardsDataService['getDiscoverSeasons'];
};

/**
 * Get season metadata for a specific season.
 *
 * @param seasonId - The ID of the season to get metadata for.
 * @returns The season metadata DTO.
 */
export type RewardsDataServiceGetSeasonMetadataAction = {
  type: `RewardsDataService:getSeasonMetadata`;
  handler: RewardsDataService['getSeasonMetadata'];
};

/**
 * Generate a challenge for SIWE (Sign-In with Ethereum) authentication.
 *
 * @param body - The challenge generation request body containing address.
 * @param body.address
 * @returns The challenge DTO.
 */
export type RewardsDataServiceGenerateChallengeAction = {
  type: `RewardsDataService:generateChallenge`;
  handler: RewardsDataService['generateChallenge'];
};

/**
 * Union of all RewardsDataService action types.
 */
export type RewardsDataServiceMethodActions =
  | RewardsDataServiceLoginAction
  | RewardsDataServiceSiweLoginAction
  | RewardsDataServiceEstimatePointsAction
  | RewardsDataServiceMobileOptinAction
  | RewardsDataServiceGetSeasonStatusAction
  | RewardsDataServiceFetchGeoLocationAction
  | RewardsDataServiceValidateReferralCodeAction
  | RewardsDataServiceMobileJoinAction
  | RewardsDataServiceSiweJoinAction
  | RewardsDataServiceGetOptInStatusAction
  | RewardsDataServiceGetDiscoverSeasonsAction
  | RewardsDataServiceGetSeasonMetadataAction
  | RewardsDataServiceGenerateChallengeAction;
