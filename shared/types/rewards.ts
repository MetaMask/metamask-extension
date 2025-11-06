/**
 * Shared types for rewards functionality
 * These types are used across UI and background to avoid import restrictions
 */

import { CaipAccountId, CaipAssetType } from '@metamask/utils';

export enum SeasonRewardType {
  Generic = 'Generic',
  PerpsDiscount = 'PerpsDiscount',
  PointsBoost = 'PointsBoost',
  AlphaFoxInvite = 'AlphaFoxInvite',
}

export type SeasonRewardDtoState = {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  shortUnlockedDescription: string;
  longUnlockedDescription: string;
  claimUrl?: string;
  iconName: string;
  rewardType: SeasonRewardType;
};

export type SeasonTierDtoState = {
  id: string;
  name: string;
  pointsNeeded: number;
  image: {
    lightModeUrl: string;
    darkModeUrl: string;
  };
  levelNumber: string;
  rewards: SeasonRewardDtoState[];
};

export type SeasonDtoState = {
  id: string;
  name: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  tiers: SeasonTierDtoState[];
  lastFetched?: number;
};

export type SeasonStatusBalanceDtoState = {
  total: number;
  updatedAt?: number; // timestamp
};

export type SeasonTierState = {
  currentTier: SeasonTierDtoState;
  nextTier: SeasonTierDtoState | null;
  nextTierPointsNeeded: number | null;
};

export type SeasonStatusState = {
  season: SeasonDtoState;
  balance: SeasonStatusBalanceDtoState;
  tier: SeasonTierState;
  lastFetched?: number;
};

export type EstimatePointsDto = {
  /**
   * Type of point earning activity
   *
   * @example 'SWAP'
   */
  activityType: PointsEventEarnType;

  /**
   * Account address performing the activity in CAIP-10 format
   *
   * @example 'eip155:1:0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
   */
  account: CaipAccountId;

  /**
   * Context data specific to the activity type
   */
  activityContext: EstimatePointsContextDto;
};

export type EstimateAssetDto = {
  /**
   * Asset identifier in CAIP-19 format
   *
   * @example 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
   */
  id: CaipAssetType;
  /**
   * Amount of the asset as a string
   *
   * @example '25739959426'
   */
  amount: string;
  /**
   * Asset price in USD PER TOKEN. Using ETH as an example, 1 ETH = 4493.23 USD at the time of writing. If provided, this will be used instead of doing a network call to get the current price.
   *
   * @example '4512.34'
   */
  usdPrice?: string;
};

export type EstimateSwapContextDto = {
  /**
   * Source asset information, in caip19 format
   *
   * @example {
   *   id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
   *   amount: '25739959426'
   * }
   */
  srcAsset: EstimateAssetDto;

  /**
   * Destination asset information, in caip19 format.
   *
   * @example {
   *   id: 'eip155:1/slip44:60',
   *   amount: '9912500000000000000'
   * }
   */
  destAsset: EstimateAssetDto;

  /**
   * Fee asset information, in caip19 format
   *
   * @example {
   *   id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
   *   amount: '100'
   * }
   */
  feeAsset: EstimateAssetDto;
};

export type EstimatePerpsContextDto = {
  /**
   * Type of the PERPS action (open position, close position, stop/loss, take profit, ...)
   *
   * @example 'OPEN_POSITION'
   */
  type: 'OPEN_POSITION' | 'CLOSE_POSITION' | 'STOP_LOSS' | 'TAKE_PROFIT';

  /**
   * USD fee value
   *
   * @example '12.34'
   */
  usdFeeValue: string;

  /**
   * Asset symbol (e.g., "ETH", "BTC")
   *
   * @example 'ETH'
   */
  coin: string;
};

export type EstimatePointsContextDto = {
  /**
   * Swap context data, must be present for SWAP activity
   */
  swapContext?: EstimateSwapContextDto;

  /**
   * PERPS context data, must be present for PERPS activity
   */
  perpsContext?: EstimatePerpsContextDto;
};

/**
 * Type of point earning activity. Swap is for swaps and bridges. PERPS is for perps activities.
 *
 * @example 'SWAP'
 */
export type PointsEventEarnType =
  | 'SWAP'
  | 'PERPS'
  | 'REFERRAL'
  | 'SIGN_UP_BONUS'
  | 'LOYALTY_BONUS'
  | 'ONE_TIME_BONUS';

export type EstimatedPointsDto = {
  /**
   * Earnable for the activity
   *
   * @example 100
   */
  pointsEstimate: number;

  /**
   * Bonus applied to the points estimate, in basis points. 100 = 1%
   *
   * @example 200
   */
  bonusBips: number;
};
