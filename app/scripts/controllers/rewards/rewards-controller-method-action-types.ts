/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { RewardsController } from './rewards-controller';

/**
 * Reset controller state to default
 */
export type RewardsControllerResetStateAction = {
  type: `RewardsController:resetState`;
  handler: RewardsController['resetState'];
};

/**
 * Get the actual subscription ID for a given CAIP account ID
 *
 * @param account - The CAIP account ID to check
 * @returns The subscription ID or null if not found
 */
export type RewardsControllerGetActualSubscriptionIdAction = {
  type: `RewardsController:getActualSubscriptionId`;
  handler: RewardsController['getActualSubscriptionId'];
};

/**
 * Check if an internal account supports opt-in for rewards.
 *
 * @param account - The internal account to check
 * @returns boolean - True if the account supports silent opt-in, false otherwise
 */
export type RewardsControllerIsOptInSupportedAction = {
  type: `RewardsController:isOptInSupported`;
  handler: RewardsController['isOptInSupported'];
};

/**
 * Check if the given account (caip-10 format) has opted in to rewards
 *
 * @param account - The account address in CAIP-10 format
 * @returns Promise<boolean> - True if the account has opted in, false otherwise
 */
export type RewardsControllerGetHasAccountOptedInAction = {
  type: `RewardsController:getHasAccountOptedIn`;
  handler: RewardsController['getHasAccountOptedIn'];
};

/**
 * Get opt-in status for multiple addresses with feature flag check
 *
 * @param params - The request parameters containing addresses
 * @returns Promise<OptInStatusDto> - The opt-in status response
 */
export type RewardsControllerGetOptInStatusAction = {
  type: `RewardsController:getOptInStatus`;
  handler: RewardsController['getOptInStatus'];
};

/**
 * Estimate points for a given activity
 *
 * @param request - The estimate points request containing activity type and context
 * @returns Promise<EstimatedPointsDto> - The estimated points and bonus information
 */
export type RewardsControllerEstimatePointsAction = {
  type: `RewardsController:estimatePoints`;
  handler: RewardsController['estimatePoints'];
};

/**
 * Check if the rewards feature is enabled via feature flag
 *
 * @returns boolean - True if rewards feature is enabled, false otherwise
 */
export type RewardsControllerIsRewardsFeatureEnabledAction = {
  type: `RewardsController:isRewardsFeatureEnabled`;
  handler: RewardsController['isRewardsFeatureEnabled'];
};

/**
 * Get season metadata with caching. This fetches and caches the season metadata including id, name, dates, and tiers.
 *
 * @param type - The type of season to get
 * @returns Promise<SeasonDtoState> - The season metadata
 */
export type RewardsControllerGetSeasonMetadataAction = {
  type: `RewardsController:getSeasonMetadata`;
  handler: RewardsController['getSeasonMetadata'];
};

/**
 * Get season status with caching
 *
 * @param subscriptionId - The subscription ID for authentication
 * @param seasonId - The ID of the season to get status for
 * @returns Promise<SeasonStatusState> - The season status data
 */
export type RewardsControllerGetSeasonStatusAction = {
  type: `RewardsController:getSeasonStatus`;
  handler: RewardsController['getSeasonStatus'];
};

/**
 * Perform the complete opt-in process for rewards
 *
 * @param accounts - The accounts to opt in
 * @param referralCode - Optional referral code
 */
export type RewardsControllerOptInAction = {
  type: `RewardsController:optIn`;
  handler: RewardsController['optIn'];
};

/**
 * Get geo rewards metadata including location and opt-in support status
 *
 * @returns Promise<GeoRewardsMetadata> - The geo rewards metadata
 */
export type RewardsControllerGetGeoRewardsMetadataAction = {
  type: `RewardsController:getGeoRewardsMetadata`;
  handler: RewardsController['getGeoRewardsMetadata'];
};

/**
 * Validate a referral code
 *
 * @param code - The referral code to validate
 * @returns Promise<boolean> - True if the code is valid, false otherwise
 */
export type RewardsControllerValidateReferralCodeAction = {
  type: `RewardsController:validateReferralCode`;
  handler: RewardsController['validateReferralCode'];
};

/**
 * Get candidate subscription ID with fallback logic
 *
 * @param primaryWalletGroupAccounts - Optional list of internal accounts from the primary account group of the active wallet
 * @returns Promise<string | null> - The subscription ID or null if none found
 */
export type RewardsControllerGetCandidateSubscriptionIdAction = {
  type: `RewardsController:getCandidateSubscriptionId`;
  handler: RewardsController['getCandidateSubscriptionId'];
};

/**
 * Link an account to a subscription via mobile join
 *
 * @param account - The account to link to the subscription
 * @param invalidateRelatedData - Whether to invalidate related cache data
 * @param primaryWalletGroupAccounts - Optional list of internal accounts from the primary account group of the active wallet
 * @returns Promise<boolean> - The updated subscription information
 */
export type RewardsControllerLinkAccountToSubscriptionCandidateAction = {
  type: `RewardsController:linkAccountToSubscriptionCandidate`;
  handler: RewardsController['linkAccountToSubscriptionCandidate'];
};

/**
 * Link multiple accounts to a subscription candidate
 *
 * @param accounts - Array of accounts to link to the subscription
 * @param primaryWalletGroupAccounts - Optional list of internal accounts from the primary account group of the active wallet
 */
export type RewardsControllerLinkAccountsToSubscriptionCandidateAction = {
  type: `RewardsController:linkAccountsToSubscriptionCandidate`;
  handler: RewardsController['linkAccountsToSubscriptionCandidate'];
};

/**
 * Union of all RewardsController action types.
 */
export type RewardsControllerMethodActions =
  | RewardsControllerResetStateAction
  | RewardsControllerGetActualSubscriptionIdAction
  | RewardsControllerIsOptInSupportedAction
  | RewardsControllerGetHasAccountOptedInAction
  | RewardsControllerGetOptInStatusAction
  | RewardsControllerEstimatePointsAction
  | RewardsControllerIsRewardsFeatureEnabledAction
  | RewardsControllerGetSeasonMetadataAction
  | RewardsControllerGetSeasonStatusAction
  | RewardsControllerOptInAction
  | RewardsControllerGetGeoRewardsMetadataAction
  | RewardsControllerValidateReferralCodeAction
  | RewardsControllerGetCandidateSubscriptionIdAction
  | RewardsControllerLinkAccountToSubscriptionCandidateAction
  | RewardsControllerLinkAccountsToSubscriptionCandidateAction;
