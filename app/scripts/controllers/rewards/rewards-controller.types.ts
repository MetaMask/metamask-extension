import { CaipAccountId, CaipAssetType } from '@metamask/utils';
import { ControllerGetStateAction } from '@metamask/base-controller';
import type { SnapControllerHandleRequestAction } from '@metamask/snaps-controllers';
import {
  AccountsControllerGetSelectedMultichainAccountAction,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import {
  KeyringControllerSignPersonalMessageAction,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { Messenger } from '@metamask/messenger';
import {
  EstimatePerpsContextDto,
  EstimateShieldContextDto,
  PointsEventEarnType,
  SeasonDtoState,
  SeasonRewardType,
  SeasonStatusState,
} from '../../../../shared/types/rewards';
import {
  RewardsDataServiceGetOptInStatusAction,
  RewardsDataServiceEstimatePointsAction,
  RewardsDataServiceGetSeasonStatusAction,
  RewardsDataServiceLoginAction,
  RewardsDataServiceSiweLoginAction,
  RewardsDataServiceMobileJoinAction,
  RewardsDataServiceSiweJoinAction,
  RewardsDataServiceMobileOptinAction,
  RewardsDataServiceValidateReferralCodeAction,
  RewardsDataServiceFetchGeoLocationAction,
  RewardsDataServiceGetSeasonMetadataAction,
  RewardsDataServiceGetDiscoverSeasonsAction,
  RewardsDataServiceGenerateChallengeAction,
} from './rewards-data-service-method-action-types';
import { RewardsControllerMethodActions } from './rewards-controller-method-action-types';

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
  createdAt: string;
  candidateAt?: string;
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

  /**
   * Previous season information
   */
  previous: SeasonInfoDto | null;
};

/**
 * Challenge DTO for SIWE (Sign-In with Ethereum) authentication
 */
export type ChallengeDto = {
  /**
   * The unique identifier of the challenge
   *
   * @example '019717cb-7d10-771e-8052-10c9be058a86'
   */
  id: string;

  /**
   * The address of the challenge, either ethereum or solana
   *
   * @example '0xbd7d160C18b51527fEBd3D6B667143B5C519C32E'
   */
  address: string;

  /**
   * The domain of the challenge
   *
   * @example 'example.com'
   */
  domain: string;

  /**
   * The nonce of the challenge
   *
   * @example '1234567890'
   */
  nonce: bigint;

  /**
   * The issued at date of the challenge
   *
   * @example '2025-01-01T00:00:00.000Z'
   */
  issuedAt: string;

  /**
   * The expiration date of the challenge
   *
   * @example '2025-01-01T00:00:00.000Z'
   */
  expirationTime: string;

  /**
   * The SIWE (Sign-In with Ethereum) message to be signed
   *
   * @example 'example.com wants you to sign in with your Ethereum account: 0x...'
   */
  message: string;
};

/**
 * Login DTO for SIWE (Sign-In with Ethereum) authentication
 */
export type SiweLoginDto = {
  /**
   * The unique identifier of the challenge
   *
   * @example '019717cb-7d10-771e-8052-10c9be058a86'
   */
  challengeId: string;

  /**
   * The signature of the SIWE message
   *
   * @example '0x...'
   */
  signature: `0x${string}`;

  /**
   * Code provided by referrer
   *
   * @example '12345'
   */
  referralCode?: string;
};

/**
 * Join DTO for SIWE (Sign-In with Ethereum) authentication
 */
export type SiweJoinDto = {
  /**
   * The unique identifier of the challenge
   *
   * @example '019717cb-7d10-771e-8052-10c9be058a86'
   */
  challengeId: string;

  /**
   * The signature of the SIWE message
   *
   * @example '0x...'
   */
  signature: `0x${string}`;
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

/**
 * A single entry in the points estimate history.
 * Used by Customer Support to verify points estimates shown to users.
 * Structure is intentionally flat to simplify debugging and log analysis.
 */
export type PointsEstimateHistoryEntry = {
  /**
   * Timestamp when the estimate was made (milliseconds since epoch)
   */
  timestamp: number;

  /**
   * Type of point earning activity (from request)
   *
   * @example 'SWAP'
   */
  requestActivityType: PointsEventEarnType;

  /**
   * Account address performing the activity in CAIP-10 format (from request)
   *
   * @example 'eip155:1:0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
   */
  requestAccount: CaipAccountId;

  /**
   * Source asset ID for swap activity in CAIP-19 format (if applicable)
   *
   * @example 'eip155:1/slip44:60'
   */
  requestSwapSrcAssetId?: CaipAssetType;

  /**
   * Source asset amount for swap activity (if applicable)
   *
   * @example '1000000000000000000'
   */
  requestSwapSrcAssetAmount?: string;

  /**
   * Source asset USD price for swap activity (if applicable)
   *
   * @example '4512.34'
   */
  requestSwapSrcAssetUsdPrice?: string;

  /**
   * Destination asset ID for swap activity in CAIP-19 format (if applicable)
   *
   * @example 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
   */
  requestSwapDestAssetId?: CaipAssetType;

  /**
   * Destination asset amount for swap activity (if applicable)
   *
   * @example '4500000000'
   */
  requestSwapDestAssetAmount?: string;

  /**
   * Destination asset USD price for swap activity (if applicable)
   *
   * @example '1.00'
   */
  requestSwapDestAssetUsdPrice?: string;

  /**
   * Fee asset ID for swap activity in CAIP-19 format (if applicable)
   *
   * @example 'eip155:1/slip44:60'
   */
  requestSwapFeeAssetId?: CaipAssetType;

  /**
   * Fee asset amount for swap activity (if applicable)
   *
   * @example '5000000000000000'
   */
  requestSwapFeeAssetAmount?: string;

  /**
   * Fee asset USD price for swap activity (if applicable)
   *
   * @example '4512.34'
   */
  requestSwapFeeAssetUsdPrice?: string;

  /**
   * Type of PERPS action (if applicable)
   *
   * @example 'OPEN_POSITION'
   */
  requestPerpsType?: EstimatePerpsContextDto['type'];

  /**
   * USD fee value for PERPS activity (if applicable)
   *
   * @example '12.34'
   */
  requestPerpsUsdFeeValue?: string;

  /**
   * Asset symbol for PERPS activity (if applicable)
   *
   * @example 'ETH'
   */
  requestPerpsCoin?: string;

  /**
   * Recurring interval for shield activity (if applicable)
   *
   * @example 'month'
   */
  requestShieldRecurringInterval?: EstimateShieldContextDto['recurringInterval'];

  /**
   * Estimated points earnable for the activity (from response)
   *
   * @example 100
   */
  responsePointsEstimate: number;

  /**
   * Bonus applied to the points estimate, in basis points (from response)
   * 100 = 1%
   *
   * @example 200
   */
  responseBonusBips: number;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RewardsControllerState = {
  rewardsActiveAccount: RewardsAccountState | null;
  rewardsAccounts: { [account: CaipAccountId]: RewardsAccountState };
  rewardsSubscriptions: { [subscriptionId: string]: SubscriptionDto };
  rewardsSeasons: { [seasonId: string]: SeasonDtoState };
  rewardsSeasonStatuses: { [compositeId: string]: SeasonStatusState };
  rewardsSubscriptionTokens: { [subscriptionId: string]: string };
  /**
   * History of points estimates for Customer Support diagnostics.
   * Stores the last N successful estimates to verify user-reported discrepancies.
   */
  rewardsPointsEstimateHistory: PointsEstimateHistoryEntry[];
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
 * Events that can be emitted by the RewardsController
 */
export type RewardsControllerEvents =
  | {
      type: 'RewardsController:stateChange';
      payload: [RewardsControllerState, Patch[]];
    }
  | RewardsControllerAccountLinkedEvent;

/**
 * Action for getting the current state of the RewardsController
 */
export type RewardsControllerGetStateAction = ControllerGetStateAction<
  'RewardsController',
  RewardsControllerState
>;

/**
 * Actions that can be performed by the RewardsController
 */
export type RewardsControllerActions =
  | RewardsControllerGetStateAction
  | RewardsControllerMethodActions;

// Don't reexport as per guidelines
type AllowedActions =
  | AccountsControllerGetSelectedMultichainAccountAction
  | AccountsControllerListMultichainAccountsAction
  | KeyringControllerSignPersonalMessageAction
  | RewardsDataServiceLoginAction
  | RewardsDataServiceSiweLoginAction
  | RewardsDataServiceEstimatePointsAction
  | RewardsDataServiceGetSeasonStatusAction
  | RewardsDataServiceFetchGeoLocationAction
  | RewardsDataServiceMobileOptinAction
  | RewardsDataServiceValidateReferralCodeAction
  | RewardsDataServiceMobileJoinAction
  | RewardsDataServiceSiweJoinAction
  | RewardsDataServiceGetOptInStatusAction
  | RewardsDataServiceGetSeasonMetadataAction
  | RewardsDataServiceGetDiscoverSeasonsAction
  | RewardsDataServiceGenerateChallengeAction
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | SnapControllerHandleRequestAction;

type AllowedEvents =
  | KeyringControllerUnlockEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type RewardsControllerMessenger = Messenger<
  'RewardsController',
  RewardsControllerActions | AllowedActions,
  RewardsControllerEvents | AllowedEvents
>;
