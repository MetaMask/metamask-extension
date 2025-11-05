import { CaipAccountId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  EstimatedPointsDto,
  EstimatePointsDto,
  SeasonDtoState,
  SeasonRewardType,
  SeasonStatusState,
} from '../../../../shared/types/rewards';

export type LoginResponseDto = {
  sessionId: string;
  subscription: SubscriptionDto;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SubscriptionDto = {
  id: string;
  referralCode: string;
  accounts: {
    address: string;
    chainId: number;
  }[];
};

export type MobileLoginDto = {
  /**
   * The account of the user
   *
   * @example '0x... or solana address.'
   */
  account: string;

  /**
   * The timestamp (epoch seconds) used in the signature.
   *
   * @example 1
   */
  timestamp: number;

  /**
   * The signature of the login (hex encoded)
   *
   * @example '0x...'
   */
  signature: `0x${string}`;
};

export type MobileOptinDto = {
  /**
   * The account of the user
   *
   * @example '0x... or solana address.'
   */
  account: string;

  /**
   * The timestamp (epoch seconds) used in the signature.
   *
   * @example 1
   */
  timestamp: number;

  /**
   * The signature of the login (hex encoded)
   *
   * @example '0x...'
   */
  signature: `0x${string}`;

  /**
   * The referral code of the user
   *
   * @example '123456'
   */
  referralCode?: string;
};

export type GetPointsEventsDto = {
  seasonId: string;
  cursor: string | null;
  forceFresh?: boolean;
};

export type GetPointsEventsLastUpdatedDto = {
  seasonId: string;
};

/**
 * Paginated list of points events
 */
export type PaginatedPointsEventsDto = {
  hasMore: boolean;
  cursor: string | null;
  results: PointsEventDto[];
};

/**
 * Asset information for events
 */
export type EventAssetDto = {
  /**
   * Amount of the token as a string
   *
   * @example '1000000000000000000'
   */
  amount: string;

  /**
   * CAIP-19 asset type
   *
   * @example 'eip155:1/slip44:60'
   */
  type: string;

  /**
   * Decimals of the token
   *
   * @example 18
   */
  decimals: number;

  /**
   * Name of the token
   *
   * @example 'Ethereum'
   */
  name?: string;

  /**
   * Symbol of the token
   *
   * @example 'ETH'
   */
  symbol?: string;
};

/**
 * Swap event payload
 */
export type SwapEventPayload = {
  /**
   * Source asset details
   */
  srcAsset: EventAssetDto;

  /**
   * Destination asset details
   */
  destAsset?: EventAssetDto;

  /**
   * Transaction hash
   *
   * @example '0x.......'
   */
  txHash?: string;
};

/**
 * PERPS event payload
 */
export type PerpsEventPayload = {
  /**
   * Type of the PERPS event
   *
   * @example 'OPEN_POSITION'
   */
  type: 'OPEN_POSITION' | 'CLOSE_POSITION' | 'TAKE_PROFIT' | 'STOP_LOSS';

  /**
   * Direction of the position
   *
   * @example 'LONG'
   */
  direction?: 'LONG' | 'SHORT';

  /**
   * Asset information
   */
  asset: EventAssetDto;

  /**
   * PNL of the position
   *
   * @example 10.0464
   */
  pnl?: string;
};

/**
 * Base points event interface
 */
type BasePointsEventDto = {
  /**
   * ID of the point earning activity
   *
   * @example '01974010-377f-7553-a365-0c33c8130980'
   */
  id: string;

  /**
   * Timestamp of the point earning activity
   *
   * @example '2021-01-01T00:00:00.000Z'
   */
  timestamp: Date;

  /**
   * Value of the point earning activity
   *
   * @example 100
   */
  value: number;

  /**
   * Bonus of the point earning activity
   *
   * @example {}
   */
  bonus: {
    bips?: number | null;
    bonuses?: string[] | null;
  } | null;

  /**
   * Account address of the point earning activity
   *
   * @example '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
   */
  accountAddress: string | null;

  /**
   * Timestamp of the point earning activity
   *
   * @example '2021-01-01T00:00:00.000Z'
   */
  updatedAt: Date;
};

/**
 * Points event with discriminated union for payloads
 */
export type PointsEventDto = BasePointsEventDto &
  (
    | {
        type: 'SWAP';
        payload: SwapEventPayload | null;
      }
    | {
        type: 'PERPS';
        payload: PerpsEventPayload | null;
      }
    | {
        type: 'REFERRAL' | 'SIGN_UP_BONUS' | 'LOYALTY_BONUS' | 'ONE_TIME_BONUS';
        payload: null;
      }
  );

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SeasonTierDto = {
  id: string;
  name: string;
  pointsNeeded: number;
  image: ThemeImage;
  levelNumber: string;
  rewards: SeasonRewardDto[];
};

export type SeasonRewardDto = {
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

export type SeasonDto = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  tiers: SeasonTierDto[];
};

export type SeasonStatusBalanceDto = {
  total: number;
  updatedAt?: Date;
};

export type SeasonStatusDto = {
  season: SeasonDto;
  balance: SeasonStatusBalanceDto;
  currentTierId: string;
};

/**
 * Response DTO for season state endpoint (new getSeasonStatus)
 */
export type SeasonStateDto = {
  /**
   * The balance for the season
   *
   * @example 0
   */
  balance: number;

  /**
   * The current tier ID
   *
   * @example '555260e8-d88b-4196-adb1-0844807bddc3'
   */
  currentTierId: string;

  /**
   * When the season state was last updated
   *
   * @example '2025-10-21T16:45:50.732Z'
   */
  updatedAt: Date;
};

/**
 * Response DTO for season metadata endpoint
 */
export type SeasonMetadataDto = {
  /**
   * The ID of the season
   *
   * @example '7444682d-9050-43b8-9038-28a6a62d6264'
   */
  id: string;

  /**
   * The name of the season
   *
   * @example 'Season 1'
   */
  name: string;

  /**
   * The start date of the season
   *
   * @example '2025-09-01T04:00:00.000Z'
   */
  startDate: Date;

  /**
   * The end date of the season
   *
   * @example '2025-11-30T04:00:00.000Z'
   */
  endDate: Date;

  /**
   * The tiers for the season
   */
  tiers: SeasonTierDto[];
};

/**
 * Season info for discover seasons endpoint
 */
export type SeasonInfoDto = {
  /**
   * The ID of the season
   *
   * @example '7444682d-9050-43b8-9038-28a6a62d6264'
   */
  id: string;

  /**
   * The start date of the season
   *
   * @example '2025-09-01T04:00:00.000Z'
   */
  startDate: Date;

  /**
   * The end date of the season
   *
   * @example '2025-11-30T04:00:00.000Z'
   */
  endDate: Date;
};

/**
 * Response DTO for discover seasons endpoint
 */
export type DiscoverSeasonsDto = {
  /**
   * Current season information
   */
  current: SeasonInfoDto | null;

  /**
   * Next season information
   */
  next: SeasonInfoDto | null;
};

export type SubscriptionReferralDetailsDto = {
  referralCode: string;
  totalReferees: number;
};

export type SubscriptionSeasonReferralDetailsDto = {
  referralCode: string;
  totalReferees: number;
};

export type PointsBoostEnvelopeDto = {
  boosts: PointsBoostDto[];
};

export type PointsBoostDto = {
  id: string;
  name: string;
  icon: ThemeImage;
  boostBips: number;
  seasonLong: boolean;
  startDate?: string;
  endDate?: string;
  backgroundColor: string;
};

export type RewardDto = {
  id: string;
  seasonRewardId: string;
  claimStatus: RewardClaimStatus;
  claim?: RewardClaim;
};

export type RewardClaimData =
  | PointsBoostRewardData
  | AlphaFoxInviteRewardData
  | null;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PointsBoostRewardData = {
  seasonPointsBonusId: string;
  activeUntil: string; // reward expiration date
  activeFrom: string; // claim date
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AlphaFoxInviteRewardData = {
  telegramHandle: string;
};

export type RewardClaim = {
  id: string;
  rewardId: string;
  accountId: string;
  data: RewardClaimData;
};

export enum RewardClaimStatus {
  UNCLAIMED = 'UNCLAIMED',
  CLAIMED = 'CLAIMED',
}

export type ThemeImage = {
  lightModeUrl: string;
  darkModeUrl: string;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RewardsAccountState = {
  account: CaipAccountId;
  hasOptedIn?: boolean;
  subscriptionId: string | null;
  perpsFeeDiscount: number | null;
  lastPerpsDiscountRateFetched: number | null;
  lastFreshOptInStatusCheck?: number | null;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RewardsControllerState = {
  rewardsActiveAccount: RewardsAccountState | null;
  rewardsAccounts: { [account: CaipAccountId]: RewardsAccountState };
  rewardsSubscriptions: { [subscriptionId: string]: SubscriptionDto };
  rewardsSeasons: { [seasonId: string]: SeasonDtoState };
  rewardsSeasonStatuses: { [compositeId: string]: SeasonStatusState };
  rewardsSubscriptionTokens: { [subscriptionId: string]: string };
};

/**
 * Event emitted when an account is linked to a subscription
 */
export type RewardsControllerAccountLinkedEvent = {
  type: 'RewardsController:accountLinked';
  payload: [
    {
      subscriptionId: string;
      account: CaipAccountId;
    },
  ];
};

/**
 * Patch type for state changes
 */
export type Patch = {
  op: 'replace' | 'add' | 'remove';
  path: string[];
  value?: unknown;
};

/**
 * Action for updating state with opt-in response
 */
export type RewardsControllerOptInAction = {
  type: 'RewardsController:optIn';
  handler: (referralCode?: string) => Promise<string | null>;
};

/**
 * Request for getting Perps discount
 */
export type GetPerpsDiscountDto = {
  /**
   * Account address in CAIP-10 format
   *
   * @example 'eip155:1:0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
   */
  account: CaipAccountId;
};

/**
 * Parsed response for Perps discount data
 */
export type PerpsDiscountData = {
  /**
   * Whether the account has opted in (0 = not opted in, 1 = opted in)
   */
  hasOptedIn: boolean;
  /**
   * The discount percentage in basis points
   *
   * @example 550
   */
  discountBips: number;
};

/**
 * Geo rewards metadata containing location and support info
 */
export type GeoRewardsMetadata = {
  /**
   * The geographic location string (e.g., 'US', 'CA-ON', 'FR')
   */
  geoLocation: string;
  /**
   * Whether the location is allowed for opt-in
   */
  optinAllowedForGeo: boolean;
};

/**
 * Action for getting opt-in status of multiple addresses with feature flag check
 */
export type RewardsControllerGetOptInStatusAction = {
  type: 'RewardsController:getOptInStatus';
  handler: (params: OptInStatusInputDto) => Promise<OptInStatusDto>;
};

/**
 * Action for estimating points for a given activity
 */
export type RewardsControllerEstimatePointsAction = {
  type: 'RewardsController:estimatePoints';
  handler: (request: EstimatePointsDto) => Promise<EstimatedPointsDto>;
};

/**
 * Action for checking if rewards feature is enabled via feature flag
 */
export type RewardsControllerIsRewardsFeatureEnabledAction = {
  type: 'RewardsController:isRewardsFeatureEnabled';
  handler: () => boolean;
};

/**
 * Action for validating referral codes
 */
export type RewardsControllerValidateReferralCodeAction = {
  type: 'RewardsController:validateReferralCode';
  handler: (code: string) => Promise<boolean>;
};

/**
 * Action for checking if an account supports opt-in
 */
export type RewardsControllerIsOptInSupportedAction = {
  type: 'RewardsController:isOptInSupported';
  handler: (account: InternalAccount) => boolean;
};

/**
 * Action for linking an account to a subscription
 */
export type RewardsControllerLinkAccountToSubscriptionAction = {
  type: 'RewardsController:linkAccountToSubscriptionCandidate';
  handler: (account: InternalAccount) => Promise<boolean>;
};

/**
 * Action for linking multiple accounts to a subscription candidate
 */
export type RewardsControllerLinkAccountsToSubscriptionCandidateAction = {
  type: 'RewardsController:linkAccountsToSubscriptionCandidate';
  handler: (
    accounts: InternalAccount[],
  ) => Promise<{ account: InternalAccount; success: boolean }[]>;
};

/**
 * Action for getting geo rewards metadata
 */
export type RewardsControllerGetGeoRewardsMetadataAction = {
  type: 'RewardsController:getGeoRewardsMetadata';
  handler: () => Promise<GeoRewardsMetadata>;
};

/**
 * Action for getting candidate subscription ID
 */
export type RewardsControllerGetCandidateSubscriptionIdAction = {
  type: 'RewardsController:getCandidateSubscriptionId';
  handler: () => Promise<string | null>;
};

/**
 * Action for getting whether the account (caip-10 format) has opted in
 */
export type RewardsControllerGetHasAccountOptedInAction = {
  type: 'RewardsController:getHasAccountOptedIn';
  handler: (account: CaipAccountId) => Promise<boolean>;
};

/**
 * Action for getting the actual subscription ID for an account
 */
export type RewardsControllerGetActualSubscriptionIdAction = {
  type: 'RewardsController:getActualSubscriptionId';
  handler: (account: CaipAccountId) => string | null;
};

/**
 * Action for getting the first subscription ID
 */
export type RewardsControllerGetFirstSubscriptionIdAction = {
  type: 'RewardsController:getFirstSubscriptionId';
  handler: () => string | null;
};

/**
 * Action for getting season metadata
 */
export type RewardsControllerGetSeasonMetadataAction = {
  type: 'RewardsController:getSeasonMetadata';
  handler: (type?: 'current' | 'next') => Promise<SeasonDtoState>;
};

/**
 * Action for getting season status
 */
export type RewardsControllerGetSeasonStatusAction = {
  type: 'RewardsController:getSeasonStatus';
  handler: (
    subscriptionId: string,
    seasonId: string,
  ) => Promise<SeasonStatusState | null>;
};

/**
 * Input DTO for getting opt-in status of multiple addresses
 */
export type OptInStatusInputDto = {
  /**
   * The addresses to check opt-in status for
   *
   * @example [
   *   '0xDE37C32E8dbD1CD325B8023a00550a5beA97eF13',
   *   '0xDE37C32E8dbD1CD325B8023a00550a5beA97eF14',
   *   '0xDE37C32E8dbD1CD325B8023a00550a5beA97eF15'
   * ]
   */
  addresses: string[];
};

/**
 * Response DTO for opt-in status of multiple addresses
 */
export type OptInStatusDto = {
  /**
   * The opt-in status of the addresses in the same order as the input
   *
   * @example [true, true, false]
   */
  ois: boolean[];

  /**
   * The subscription IDs of the addresses in the same order as the input
   *
   * @example ['sub_123', 'sub_456', null]
   */
  sids: (string | null)[];
};

/**
 * Response DTO for opt-out operation
 */
export type OptOutDto = {
  /**
   * Whether the opt-out operation was successful
   *
   * @example true
   */
  success: boolean;
};
