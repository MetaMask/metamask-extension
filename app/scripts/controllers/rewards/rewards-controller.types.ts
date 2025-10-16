import { ControllerGetStateAction } from '@metamask/base-controller';
import { CaipAccountId, CaipAssetType } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';

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

export type GetPointsEventsDto = {
  seasonId: string;
  subscriptionId: string;
  cursor: string | null;
  forceFresh?: boolean;
};

export type GetPointsEventsLastUpdatedDto = {
  seasonId: string;
  subscriptionId: string;
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

export enum SeasonRewardType {
  Generic = 'Generic',
  PerpsDiscount = 'PerpsDiscount',
  PointsBoost = 'PointsBoost',
  AlphaFoxInvite = 'AlphaFoxInvite',
}

export type SeasonDto = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  tiers: SeasonTierDto[];
};

export type SeasonStatusBalanceDto = {
  total: number;
  refereePortion: number;
  updatedAt?: Date;
};

export type SeasonStatusDto = {
  season: SeasonDto;
  balance: SeasonStatusBalanceDto;
  currentTierId: string;
};

export type SubscriptionReferralDetailsDto = {
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

export type ClaimRewardDto = {
  data?: Record<string, string>;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SubscriptionReferralDetailsState = {
  referralCode: string;
  totalReferees: number;
  lastFetched?: number;
};

// Serializable versions for state storage (Date objects converted to timestamps)
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SeasonDtoState = {
  id: string;
  name: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  tiers: SeasonTierDtoState[];
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SeasonStatusBalanceDtoState = {
  total: number;
  refereePortion: number;
  updatedAt?: number; // timestamp
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SeasonTierState = {
  currentTier: SeasonTierDtoState;
  nextTier: SeasonTierDtoState | null;
  nextTierPointsNeeded: number | null;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SeasonStatusState = {
  season: SeasonDtoState;
  balance: SeasonStatusBalanceDtoState;
  tier: SeasonTierState;
  lastFetched?: number;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ActiveBoostsState = {
  boosts: {
    id: string;
    name: string;
    icon: {
      lightModeUrl: string;
      darkModeUrl: string;
    };
    boostBips: number;
    seasonLong: boolean;
    startDate?: string;
    endDate?: string;
    backgroundColor: string;
  }[];
  lastFetched: number;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type UnlockedRewardsState = {
  rewards: {
    id: string;
    seasonRewardId: string;
    claimStatus: RewardClaimStatus;
    claim?: {
      id: string;
      rewardId: string;
      accountId: string; // Changed from bigint to string for JSON serialization
      data: RewardClaimData;
    };
  }[];
  lastFetched: number;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PointsEventsDtoState = {
  results: {
    id: string;
    timestamp: number;
    value: number;
    bonus: { bips?: number | null; bonuses?: string[] | null } | null;
    accountAddress: string | null;
    type: string;
    updatedAt: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
  }[];
  hasMore: boolean;
  cursor: string | null;
  lastFetched: number;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RewardsAccountState = {
  account: CaipAccountId;
  hasOptedIn?: boolean;
  subscriptionId: string | null;
  perpsFeeDiscount: number | null;
  lastPerpsDiscountRateFetched: number | null;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RewardsControllerState = {
  activeAccount: RewardsAccountState | null;
  accounts: { [account: CaipAccountId]: RewardsAccountState };
  subscriptions: { [subscriptionId: string]: SubscriptionDto };
  seasons: { [seasonId: string]: SeasonDtoState };
  subscriptionReferralDetails: {
    [subscriptionId: string]: SubscriptionReferralDetailsState;
  };
  seasonStatuses: { [compositeId: string]: SeasonStatusState };
  activeBoosts: { [compositeId: string]: ActiveBoostsState };
  unlockedRewards: { [compositeId: string]: UnlockedRewardsState };
  pointsEvents: { [compositeId: string]: PointsEventsDtoState };
  subscriptionTokens: { [subscriptionId: string]: string };
  rewardsEnabled: boolean;
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
 * Event emitted when a reward is claimed
 */
export type RewardsControllerRewardClaimedEvent = {
  type: 'RewardsController:rewardClaimed';
  payload: [
    {
      rewardId: string;
      subscriptionId: string;
    },
  ];
};

/**
 * Event emitted when balance data should be invalidated
 */
export type RewardsControllerBalanceUpdatedEvent = {
  type: 'RewardsController:balanceUpdated';
  payload: [
    {
      seasonId: string;
      subscriptionId: string;
    },
  ];
};

/**
 * Event emitted when points events should be invalidated
 */
export type RewardsControllerPointsEventsUpdatedEvent = {
  type: 'RewardsController:pointsEventsUpdated';
  payload: [
    {
      seasonId: string;
      subscriptionId: string;
    },
  ];
};

/**
 * Events that can be emitted by the RewardsController
 */
export type RewardsControllerEvents =
  | {
      type: 'RewardsController:stateChange';
      payload: [RewardsControllerState, Patch[]];
    }
  | RewardsControllerAccountLinkedEvent
  | RewardsControllerRewardClaimedEvent
  | RewardsControllerBalanceUpdatedEvent
  | RewardsControllerPointsEventsUpdatedEvent;

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
  handler: (
    account: InternalAccount,
    referralCode?: string,
  ) => Promise<string | null>;
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
 * Action for getting whether the account (caip-10 format) has opted in
 */
export type RewardsControllerGetHasAccountOptedInAction = {
  type: 'RewardsController:getHasAccountOptedIn';
  handler: (account: CaipAccountId) => Promise<boolean>;
};

/**
 * Action for getting opt-in status of multiple addresses with feature flag check
 */
export type RewardsControllerGetOptInStatusAction = {
  type: 'RewardsController:getOptInStatus';
  handler: (params: OptInStatusInputDto) => Promise<OptInStatusDto>;
};

/**
 * Action for getting points events for a given season
 */
export type RewardsControllerGetPointsEventsAction = {
  type: 'RewardsController:getPointsEvents';
  handler: (params: GetPointsEventsDto) => Promise<PaginatedPointsEventsDto>;
};

/**
 * Action for estimating points for a given activity
 */
export type RewardsControllerEstimatePointsAction = {
  type: 'RewardsController:estimatePoints';
  handler: (request: EstimatePointsDto) => Promise<EstimatedPointsDto>;
};

/**
 * Action for getting perps fee discount in bips for an account
 */
export type RewardsControllerGetPerpsDiscountAction = {
  type: 'RewardsController:getPerpsDiscountForAccount';
  handler: (account: CaipAccountId) => Promise<number>;
};

/**
 * Action for checking if rewards feature is enabled via feature flag
 */
export type RewardsControllerIsRewardsFeatureEnabledAction = {
  type: 'RewardsController:isRewardsFeatureEnabled';
  handler: () => boolean;
};

/**
 * Action for getting season status with caching
 */
export type RewardsControllerGetSeasonStatusAction = {
  type: 'RewardsController:getSeasonStatus';
  handler: (
    seasonId: string,
    subscriptionId: string,
  ) => Promise<SeasonStatusState | null>;
};

/**
 * Action for getting referral details with caching
 */
export type RewardsControllerGetReferralDetailsAction = {
  type: 'RewardsController:getReferralDetails';
  handler: (
    subscriptionId: string,
  ) => Promise<SubscriptionReferralDetailsState | null>;
};

/**
 * Action for logging out a user
 */
export type RewardsControllerLogoutAction = {
  type: 'RewardsController:logout';
  handler: () => Promise<void>;
};

/**
 * Action for getting geo rewards metadata
 */
export type RewardsControllerGetGeoRewardsMetadataAction = {
  type: 'RewardsController:getGeoRewardsMetadata';
  handler: () => Promise<GeoRewardsMetadata>;
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
 * Action for getting the actual subscription ID for a CAIP account ID
 */
export type RewardsControllerGetActualSubscriptionIdAction = {
  type: 'RewardsController:getActualSubscriptionId';
  handler: (account: CaipAccountId) => string | null;
};

/**
 * Action for getting the first subscription ID from the subscriptions map
 */
export type RewardsControllerGetFirstSubscriptionIdAction = {
  type: 'RewardsController:getFirstSubscriptionId';
  handler: () => string | null;
};

/**
 * Action for linking an account to a subscription
 */
export type RewardsControllerLinkAccountToSubscriptionAction = {
  type: 'RewardsController:linkAccountToSubscriptionCandidate';
  handler: (account: InternalAccount) => Promise<boolean>;
};

/**
 * Action for getting candidate subscription ID
 */
export type RewardsControllerGetCandidateSubscriptionIdAction = {
  type: 'RewardsController:getCandidateSubscriptionId';
  handler: () => Promise<string | null>;
};

/**
 * Action for opting out of rewards program
 */
export type RewardsControllerOptOutAction = {
  type: 'RewardsController:optOut';
  handler: (subscriptionId: string) => Promise<boolean>;
};

/**
 * Action for getting active points boosts
 */
export type RewardsControllerGetActivePointsBoostsAction = {
  type: 'RewardsController:getActivePointsBoosts';
  handler: (
    seasonId: string,
    subscriptionId: string,
  ) => Promise<PointsBoostDto[]>;
};

/**
 * Action for getting unlocked rewards for a season
 */
export type RewardsControllerGetUnlockedRewardsAction = {
  type: 'RewardsController:getUnlockedRewards';
  handler: (seasonId: string, subscriptionId: string) => Promise<RewardDto[]>;
};

/**
 * Action for claiming a reward
 */
export type RewardsControllerClaimRewardAction = {
  type: 'RewardsController:claimReward';
  handler: (
    rewardId: string,
    subscriptionId: string,
    dto?: ClaimRewardDto,
  ) => Promise<void>;
};

/**
 * Action for resetting controller state
 */
export type RewardsControllerResetAllAction = {
  type: 'RewardsController:resetAll';
  handler: () => Promise<void>;
};

/**
 * Actions that can be performed by the RewardsController
 */
export type RewardsControllerActions =
  | ControllerGetStateAction<'RewardsController', RewardsControllerState>
  | RewardsControllerGetHasAccountOptedInAction
  | RewardsControllerGetOptInStatusAction
  | RewardsControllerGetPointsEventsAction
  | RewardsControllerEstimatePointsAction
  | RewardsControllerGetPerpsDiscountAction
  | RewardsControllerIsRewardsFeatureEnabledAction
  | RewardsControllerGetSeasonStatusAction
  | RewardsControllerGetReferralDetailsAction
  | RewardsControllerOptInAction
  | RewardsControllerLogoutAction
  | RewardsControllerGetGeoRewardsMetadataAction
  | RewardsControllerValidateReferralCodeAction
  | RewardsControllerIsOptInSupportedAction
  | RewardsControllerGetActualSubscriptionIdAction
  | RewardsControllerGetFirstSubscriptionIdAction
  | RewardsControllerLinkAccountToSubscriptionAction
  | RewardsControllerGetCandidateSubscriptionIdAction
  | RewardsControllerOptOutAction
  | RewardsControllerGetActivePointsBoostsAction
  | RewardsControllerGetUnlockedRewardsAction
  | RewardsControllerClaimRewardAction
  | RewardsControllerResetAllAction;

export const CURRENT_SEASON_ID = 'current';

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
