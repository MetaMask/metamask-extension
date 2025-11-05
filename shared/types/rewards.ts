/**
 * Shared types for rewards functionality
 * These types are used across UI and background to avoid import restrictions
 */

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
