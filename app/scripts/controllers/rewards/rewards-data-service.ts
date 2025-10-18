import type { RestrictedMessenger } from '@metamask/base-controller';
import type {
  LoginResponseDto,
  EstimatePointsDto,
  EstimatedPointsDto,
  GetPerpsDiscountDto,
  PerpsDiscountData,
  SeasonStatusDto,
  SubscriptionReferralDetailsDto,
  PaginatedPointsEventsDto,
  GetPointsEventsDto,
  MobileLoginDto,
  SubscriptionDto,
  OptInStatusInputDto,
  OptInStatusDto,
  OptOutDto,
  PointsBoostEnvelopeDto,
  RewardDto,
  ClaimRewardDto,
  GetPointsEventsLastUpdatedDto,
  MobileOptinDto,
} from './rewards-controller.types';
// TODO: find similar functionality in extession
// import { getSubscriptionToken } from '../utils/multi-subscription-token-vault';
import log from 'loglevel';
import { successfulFetch } from '@metamask/controller-utils';
import { ENVIRONMENT } from '../../../../development/build/constants';
import ExtensionPlatform from '../../platforms/extension';
import { REWARDS_API_URL } from '../../../../shared/constants/rewards';

/**
 * Custom error for invalid timestamps
 */
export class InvalidTimestampError extends Error {
  timestamp: number;

  constructor(message: string, timestamp: number) {
    super(message);
    this.name = 'InvalidTimestampError';
    this.timestamp = timestamp;
  }
}

/**
 * Custom error for authorization failures
 */
export class AuthorizationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationFailedError';
  }
}

const SERVICE_NAME = 'RewardsDataService';

// Default timeout for all API requests (10 seconds)
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

// Geolocation URLs for different environments
const GEOLOCATION_URLS = {
  DEV: 'https://on-ramp.dev-api.cx.metamask.io/geolocation',
  PROD: 'https://on-ramp.api.cx.metamask.io/geolocation',
};

// Auth endpoint action types

export interface RewardsDataServiceLoginAction {
  type: `${typeof SERVICE_NAME}:login`;
  handler: RewardsDataService['login'];
}

export interface RewardsDataServiceGetPointsEventsAction {
  type: `${typeof SERVICE_NAME}:getPointsEvents`;
  handler: RewardsDataService['getPointsEvents'];
}

export interface RewardsDataServiceGetPointsEventsLastUpdatedAction {
  type: `${typeof SERVICE_NAME}:getPointsEventsLastUpdated`;
  handler: RewardsDataService['getPointsEventsLastUpdated'];
}

export interface RewardsDataServiceEstimatePointsAction {
  type: `${typeof SERVICE_NAME}:estimatePoints`;
  handler: RewardsDataService['estimatePoints'];
}

export interface RewardsDataServiceGetPerpsDiscountAction {
  type: `${typeof SERVICE_NAME}:getPerpsDiscount`;
  handler: RewardsDataService['getPerpsDiscount'];
}
export interface RewardsDataServiceMobileOptinAction {
  type: `${typeof SERVICE_NAME}:mobileOptin`;
  handler: RewardsDataService['mobileOptin'];
}

export interface RewardsDataServiceLogoutAction {
  type: `${typeof SERVICE_NAME}:logout`;
  handler: RewardsDataService['logout'];
}

export interface RewardsDataServiceGetSeasonStatusAction {
  type: `${typeof SERVICE_NAME}:getSeasonStatus`;
  handler: RewardsDataService['getSeasonStatus'];
}

export interface RewardsDataServiceGetReferralDetailsAction {
  type: `${typeof SERVICE_NAME}:getReferralDetails`;
  handler: RewardsDataService['getReferralDetails'];
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

export interface RewardsDataServiceOptOutAction {
  type: `${typeof SERVICE_NAME}:optOut`;
  handler: RewardsDataService['optOut'];
}

export interface RewardsDataServiceGetActivePointsBoostsAction {
  type: `${typeof SERVICE_NAME}:getActivePointsBoosts`;
  handler: RewardsDataService['getActivePointsBoosts'];
}

export interface RewardsDataServiceGetUnlockedRewardsAction {
  type: `${typeof SERVICE_NAME}:getUnlockedRewards`;
  handler: RewardsDataService['getUnlockedRewards'];
}

export interface RewardsDataServiceClaimRewardAction {
  type: `${typeof SERVICE_NAME}:claimReward`;
  handler: RewardsDataService['claimReward'];
}

export type RewardsDataServiceActions =
  | RewardsDataServiceLoginAction
  | RewardsDataServiceGetPointsEventsAction
  | RewardsDataServiceGetPointsEventsLastUpdatedAction
  | RewardsDataServiceEstimatePointsAction
  | RewardsDataServiceGetPerpsDiscountAction
  | RewardsDataServiceGetSeasonStatusAction
  | RewardsDataServiceGetReferralDetailsAction
  | RewardsDataServiceMobileOptinAction
  | RewardsDataServiceLogoutAction
  | RewardsDataServiceFetchGeoLocationAction
  | RewardsDataServiceValidateReferralCodeAction
  | RewardsDataServiceMobileJoinAction
  | RewardsDataServiceGetOptInStatusAction
  | RewardsDataServiceOptOutAction
  | RewardsDataServiceGetActivePointsBoostsAction
  | RewardsDataServiceGetUnlockedRewardsAction
  | RewardsDataServiceClaimRewardAction;

export type RewardsDataServiceMessenger = RestrictedMessenger<
  typeof SERVICE_NAME,
  RewardsDataServiceActions,
  never,
  never['type'],
  never['type']
>;

/**
 * Data service for rewards API endpoints
 */
export class RewardsDataService {
  readonly #messenger: RewardsDataServiceMessenger;

  readonly #fetch: typeof fetch;

  readonly #appType: 'mobile' | 'extension';

  readonly #locale: string;

  readonly #rewardsApiUrl: string;

  constructor({
    messenger,
    fetch: fetchFunction,
    appType = 'mobile',
    locale = 'en-US',
  }: {
    messenger: RewardsDataServiceMessenger;
    fetch: typeof fetch;
    appType?: 'mobile' | 'extension';
    locale?: string;
  }) {
    this.#messenger = messenger;
    this.#fetch = fetchFunction;
    this.#appType = appType;
    this.#locale = locale;
    this.#rewardsApiUrl = this.getRewardsApiBaseUrl();
    // Register all action handlers
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:login`,
      this.login.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getPointsEvents`,
      this.getPointsEvents.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getPointsEventsLastUpdated`,
      this.getPointsEventsLastUpdated.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:estimatePoints`,
      this.estimatePoints.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getPerpsDiscount`,
      this.getPerpsDiscount.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:mobileOptin`,
      this.mobileOptin.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:logout`,
      this.logout.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getSeasonStatus`,
      this.getSeasonStatus.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getReferralDetails`,
      this.getReferralDetails.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:fetchGeoLocation`,
      this.fetchGeoLocation.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:validateReferralCode`,
      this.validateReferralCode.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:mobileJoin`,
      this.mobileJoin.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getOptInStatus`,
      this.getOptInStatus.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:optOut`,
      this.optOut.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getActivePointsBoosts`,
      this.getActivePointsBoosts.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getUnlockedRewards`,
      this.getUnlockedRewards.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:claimReward`,
      this.claimReward.bind(this),
    );
  }

  /**
   * Check if the build is a Development or Test build.
   *
   * @returns true if the build is a Development or Test build, false otherwise
   */
  private isDevOrTestBuild() {
    return (
      process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
      process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING
    );
  }

  // TODO: revisit the logic to build the correct base URL
  private getRewardsApiBaseUrl() {
    // always using url from env var if set
    if (process.env.REWARDS_API_URL) return process.env.REWARDS_API_URL;
    // otherwise using default per-env url
    if (process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.PRODUCTION) {
      return REWARDS_API_URL.PRD;
    }
    return REWARDS_API_URL.UAT;
  }

  /**
   * Make a request to the rewards API
   * @param endpoint - The endpoint to request
   * @param options - The options for the request
   * @param subscriptionId - The subscription ID to use for the request, used for authenticated requests
   * @param timeoutMs - Custom timeout in milliseconds, defaults to DEFAULT_REQUEST_TIMEOUT_MS
   * @returns The response from the request
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    subscriptionId?: string,
    timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add client identification header (matches web3_clientVersion format)
    try {
      const extensionPlatform = new ExtensionPlatform();
      const version = extensionPlatform.getVersion();
      headers['rewards-client-id'] = `${this.#appType}-${version}`;
    } catch (error) {
      // Continue without client header if version retrieval fails
      console.warn('Failed to retrieve app version for client header:', error);
    }

    // Add bearer token for authenticated requests
    // TODO: find similar functionality in extension
    // try {
    //   if (subscriptionId) {
    //     const tokenResult = await getSubscriptionToken(subscriptionId);
    //     if (tokenResult.success && tokenResult.token) {
    //       headers['rewards-access-token'] = tokenResult.token;
    //     }
    //   }
    // } catch (error) {
    //   // Continue without bearer token if retrieval fails
    //   console.warn('Failed to retrieve bearer token:', error);
    // }

    // Add locale header for internationalization
    if (this.#locale) {
      headers['Accept-Language'] = this.#locale;
    }

    const url = `${this.#rewardsApiUrl}${endpoint}`;

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await this.#fetch(url, {
        credentials: 'omit',
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if the error is due to timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }

      throw error;
    }
  }

  /**
   * Perform login via signature for the current account.
   * @param body - The login request body containing account, timestamp, and signature.
   * @returns The login response DTO.
   */
  async login(body: {
    account: string;
    timestamp: number;
    signature: string;
  }): Promise<LoginResponseDto> {
    // For now, we're using the mobile-login endpoint for these types of login requests.
    // Our previous login endpoint had a slightly different flow as it was not based around silent auth.
    const response = await this.makeRequest('/auth/mobile-login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();

      if (errorData?.message?.includes('Invalid timestamp')) {
        // Retry signing with a new timestamp
        throw new InvalidTimestampError(
          'Invalid timestamp. Please try again with a new timestamp.',
          Math.floor(Number(errorData.serverTimestamp) / 1000),
        );
      }
      throw new Error(`Login failed: ${response.status}`);
    }

    return (await response.json()) as LoginResponseDto;
  }

  /**
   * Get a list of points events for the season
   * @param params - The request parameters containing
   * @returns The list of points events DTO.
   */
  async getPointsEvents(
    params: GetPointsEventsDto,
  ): Promise<PaginatedPointsEventsDto> {
    const { seasonId, subscriptionId, cursor } = params;

    let url = `/seasons/${seasonId}/points-events`;
    if (cursor) url += `?cursor=${encodeURIComponent(cursor)}`;

    const response = await this.makeRequest(
      url,
      {
        method: 'GET',
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(`Get points events failed: ${response.status}`);
    }

    return (await response.json()) as PaginatedPointsEventsDto;
  }

  async getPointsEventsLastUpdated(
    params: GetPointsEventsLastUpdatedDto,
  ): Promise<Date | null> {
    const { seasonId, subscriptionId } = params;
    const response = await this.makeRequest(
      `/seasons/${seasonId}/points-events/last-updated`,
      {
        method: 'GET',
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(
        `Get points events last update failed: ${response.status}`,
      );
    }
    const result = await response.json();
    return result?.lastUpdated ? new Date(result.lastUpdated) : null;
  }

  /**
   * Estimate points for a given activity.
   * @param body - The estimate points request body.
   * @returns The estimated points response DTO.
   */
  async estimatePoints(body: EstimatePointsDto): Promise<EstimatedPointsDto> {
    const response = await this.makeRequest('/points-estimation', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Points estimation failed: ${response.status}`);
    }

    return (await response.json()) as EstimatedPointsDto;
  }

  /**
   * Get Perps fee discount in bips for a given address.
   * @param params - The request parameters containing the CAIP-10 address.
   * @returns The parsed Perps discount data containing opt-in status and discount percentage.
   */
  async getPerpsDiscount(
    params: GetPerpsDiscountDto,
  ): Promise<PerpsDiscountData> {
    const response = await this.makeRequest(
      `/public/rewards/perps-fee-discount/${params.account}`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new Error(`Get Perps discount failed: ${response.status}`);
    }

    const responseText = await response.text();

    // Parse the X,Y format where X is opt-in status (0 or 1) and Y is discount
    const parts = responseText.split(',');
    if (parts.length !== 2) {
      throw new Error(
        `Invalid perps discount response format: ${responseText}`,
      );
    }

    const optInStatus = parseInt(parts[0]);
    const discountBips = parseFloat(parts[1]);

    if (isNaN(optInStatus) || isNaN(discountBips)) {
      throw new Error(
        `Invalid perps discount values: optIn=${parts[0]}, discount=${parts[1]}`,
      );
    }

    if (optInStatus !== 0 && optInStatus !== 1) {
      throw new Error(
        `Invalid opt-in status: ${optInStatus}. Expected 0 or 1.`,
      );
    }

    return {
      hasOptedIn: optInStatus === 1,
      discountBips,
    };
  }

  /**
   * Perform optin via signature for the current account.
   * @param body - The login request body containing account, timestamp, signature and referral code.
   * @returns The login response DTO.
   */
  async mobileOptin(body: MobileOptinDto): Promise<LoginResponseDto> {
    const response = await this.makeRequest('/auth/mobile-optin', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      log.error('RewardsDataService: mobileOptin errorData', errorData);

      if (errorData?.message?.includes('Invalid timestamp')) {
        // Retry signing with a new timestamp
        throw new InvalidTimestampError(
          'Invalid timestamp. Please try again with a new timestamp.',
          Math.floor(Number(errorData.serverTimestamp) / 1000),
        );
      }
      throw new Error(`Optin failed: ${response.status}`);
    }

    return (await response.json()) as LoginResponseDto;
  }

  /**
   * Perform logout for the current authenticated session.
   * @param subscriptionId - The subscription ID to use for the authenticated request.
   * @returns Promise that resolves when logout is complete.
   */
  async logout(subscriptionId?: string): Promise<void> {
    const response = await this.makeRequest(
      '/auth/logout',
      {
        method: 'POST',
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status}`);
    }
  }

  /**
   * Get season status for a specific season.
   * @param seasonId - The ID of the season to get status for.
   * @param subscriptionId - The subscription ID for authentication.
   * @returns The season status DTO.
   */
  async getSeasonStatus(
    seasonId: string,
    subscriptionId: string,
  ): Promise<SeasonStatusDto> {
    const response = await this.makeRequest(
      `/seasons/${seasonId}/status`,
      {
        method: 'GET',
      },
      subscriptionId,
    );

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData?.message?.includes('Rewards authorization failed')) {
        throw new AuthorizationFailedError(
          'Rewards authorization failed. Please login and try again.',
        );
      }

      throw new Error(`Get season status failed: ${response.status}`);
    }

    const data = await response.json();

    // Convert date strings to Date objects
    if (data.balance?.updatedAt) {
      data.balance.updatedAt = new Date(data.balance.updatedAt);
    }
    if (data.season) {
      if (data.season.startDate) {
        data.season.startDate = new Date(data.season.startDate);
      }
      if (data.season.endDate) {
        data.season.endDate = new Date(data.season.endDate);
      }
    }

    return data as SeasonStatusDto;
  }

  /**
   * Get referral details for a specific subscription.
   * @param subscriptionId - The subscription ID for authentication.
   * @returns The referral details DTO.
   */
  async getReferralDetails(
    subscriptionId: string,
  ): Promise<SubscriptionReferralDetailsDto> {
    const response = await this.makeRequest(
      '/subscriptions/referral-details',
      {
        method: 'GET',
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(`Get referral details failed: ${response.status}`);
    }

    return (await response.json()) as SubscriptionReferralDetailsDto;
  }

  /**
   * Fetch geolocation information from MetaMask's geolocation service.
   * Returns location in Country or Country-Region format (e.g., 'US', 'CA-ON', 'FR').
   * @returns Promise<string> - The geolocation string or 'UNKNOWN' on failure.
   */
  async fetchGeoLocation(): Promise<string> {
    let location = 'UNKNOWN';

    try {
      const environment = this.isDevOrTestBuild() ? 'DEV' : 'PROD';
      const response = await successfulFetch(GEOLOCATION_URLS[environment]);

      if (!response.ok) {
        return location;
      }
      location = await response?.text();
      return location;
    } catch (e) {
      log.error('RewardsDataService: Failed to fetch geoloaction', e);
      return location;
    }
  }

  /**
   * Validate a referral code.
   * @param code - The referral code to validate.
   * @returns Promise<{valid: boolean}> - Object indicating if the code is valid.
   */
  async validateReferralCode(code: string): Promise<{ valid: boolean }> {
    const response = await this.makeRequest(
      `/referral/validate?code=${encodeURIComponent(code)}`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to validate referral code. Please try again shortly.`,
      );
    }

    return (await response.json()) as { valid: boolean };
  }

  /**
   * Join an account to a subscription via mobile login.
   * @param body - The mobile login request body containing account, timestamp, and signature.
   * @param subscriptionId - The subscription ID to join the account to.
   * @returns Promise<SubscriptionDto> - The updated subscription information.
   */
  async mobileJoin(
    body: MobileLoginDto,
    subscriptionId: string,
  ): Promise<SubscriptionDto> {
    const response = await this.makeRequest(
      '/wr/subscriptions/mobile-join',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      subscriptionId,
    );

    if (!response.ok) {
      const errorData = await response.json();
      log.error('RewardsDataService: mobileJoin errorData', errorData);

      if (errorData?.message?.includes('Invalid timestamp')) {
        // Retry signing with a new timestamp
        throw new InvalidTimestampError(
          'Invalid timestamp. Please try again with a new timestamp.',
          Math.floor(Number(errorData.serverTimestamp) / 1000),
        );
      }
      throw new Error(
        `Mobile join failed: ${response.status} ${errorData?.message || ''}`,
      );
    }

    return (await response.json()) as SubscriptionDto;
  }

  /**
   * Get opt-in status for multiple addresses.
   * @param body - The request body containing addresses to check.
   * @returns Promise<OptInStatusDto> - The opt-in status for each address.
   */
  async getOptInStatus(body: OptInStatusInputDto): Promise<OptInStatusDto> {
    // Validate input
    if (!body.addresses || body.addresses.length === 0) {
      throw new Error('Addresses are required');
    }
    if (body.addresses.length > 500) {
      throw new Error('Addresses must be less than 500');
    }

    const response = await this.makeRequest('/public/rewards/ois', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Get opt-in status failed: ${response.status}`);
    }

    return (await response.json()) as OptInStatusDto;
  }

  /**
   * Opt-out and delete the subscription.
   * @param subscriptionId - The subscription ID for authentication.
   * @returns Promise<OptOutDto> - The opt-out response.
   */
  async optOut(subscriptionId: string): Promise<OptOutDto> {
    const response = await this.makeRequest(
      '/wr/subscriptions/opt-out',
      {
        method: 'POST',
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(`Opt-out failed: ${response.status}`);
    }

    return (await response.json()) as OptOutDto;
  }

  /**
   * Get the active season boosts for a specific subscription.
   * @param seasonId - The ID of the season to get status for.
   * @param subscriptionId - The subscription ID for authentication.
   * @returns The active points boosts DTO.
   */
  async getActivePointsBoosts(
    seasonId: string,
    subscriptionId: string,
  ): Promise<PointsBoostEnvelopeDto> {
    const response = await this.makeRequest(
      `/seasons/${seasonId}/active-boosts`,
      {
        method: 'GET',
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(`Failed to get active rewards boost: ${response.status}`);
    }

    return (await response.json()) as PointsBoostEnvelopeDto;
  }

  /**
   * Get the unlocked rewards for a specific subscription.
   * @param seasonId - The ID of the season to get status for.
   * @param subscriptionId - The subscription ID for authentication.
   * @returns The rewards DTO.
   */
  async getUnlockedRewards(
    seasonId: string,
    subscriptionId: string,
  ): Promise<RewardDto[]> {
    const response = await this.makeRequest(
      `/rewards?seasonId=${seasonId}`,
      {
        method: 'GET',
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(`Failed to get unlocked: ${response.status}`);
    }

    return (await response.json()) as RewardDto[];
  }

  /**
   * Claim a reward.
   * @param rewardId - The ID of the reward to claim.
   * @param dto - The claim reward request body.
   * @param subscriptionId - The subscription ID for authentication.
   * @returns The claim reward DTO.
   */
  async claimReward(
    rewardId: string,
    subscriptionId: string,
    dto?: ClaimRewardDto,
  ): Promise<void> {
    const response = await this.makeRequest(
      `/wr/rewards/${rewardId}/claim`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
      subscriptionId,
    );

    if (!response.ok) {
      throw new Error(`Failed to claim reward: ${response.status}`);
    }
  }
}
