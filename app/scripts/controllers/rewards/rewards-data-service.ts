/* eslint-disable @typescript-eslint/consistent-type-definitions */
// TODO: find similar functionality in extession
// import { getSubscriptionToken } from '../utils/multi-subscription-token-vault';
import log from 'loglevel';
import { ENVIRONMENT } from '../../../../development/build/constants';
import ExtensionPlatform from '../../platforms/extension';
import { REWARDS_API_URL } from '../../../../shared/constants/rewards';
import type { RewardsDataServiceMessenger } from '../../controller-init/messengers/reward-data-service-messenger';
import { FALLBACK_LOCALE } from '../../../../shared/modules/i18n';
import {
  EstimatePointsDto,
  EstimatedPointsDto,
} from '../../../../shared/types/rewards';
import type {
  LoginResponseDto,
  MobileLoginDto,
  SubscriptionDto,
  OptInStatusInputDto,
  OptInStatusDto,
  MobileOptinDto,
  SeasonStateDto,
  SeasonMetadataDto,
  DiscoverSeasonsDto,
} from './rewards-controller.types';

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

/**
 * Custom error for season not found
 */
export class SeasonNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeasonNotFoundError';
  }
}

/**
 * Custom error for account already registered (409 conflict)
 */
export class AccountAlreadyRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountAlreadyRegisteredError';
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

/**
 * Normalises the extension locale path to use hyphens ('-') instead of underscores ('_')
 *
 * @param locale - extension locale
 * @returns normalised locale
 */
export const getNormalisedLocale = (locale: string): string =>
  Intl.getCanonicalLocales(
    locale ? locale.replace(/_/gu, '-') : FALLBACK_LOCALE,
  )[0];

/**
 * Data service for rewards API endpoints
 */
export class RewardsDataService {
  readonly name: typeof SERVICE_NAME = SERVICE_NAME;

  readonly #messenger: RewardsDataServiceMessenger;

  readonly #fetch: typeof fetch;

  readonly #rewardsApiUrl: string;

  constructor({
    messenger,
    fetch: fetchFunction,
  }: {
    messenger: RewardsDataServiceMessenger;
    fetch: typeof fetch;
  }) {
    this.#messenger = messenger;
    this.#fetch = fetchFunction;
    this.#rewardsApiUrl = this.getRewardsApiBaseUrl();

    // Register all action handlers
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:login`,
      this.login.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:estimatePoints`,
      this.estimatePoints.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:mobileOptin`,
      this.mobileOptin.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getSeasonStatus`,
      this.getSeasonStatus.bind(this),
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
      `${SERVICE_NAME}:getSeasonMetadata`,
      this.getSeasonMetadata.bind(this),
    );
    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getDiscoverSeasons`,
      this.getDiscoverSeasons.bind(this),
    );
  }

  getRewardsApiBaseUrl() {
    if (
      process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.PRODUCTION ||
      process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.RELEASE_CANDIDATE
    ) {
      return REWARDS_API_URL.PRD;
    }
    return REWARDS_API_URL.UAT;
  }

  /**
   * Get the current locale from PreferencesController and normalize it.
   *
   * @returns The normalized locale string in formats 'en-US' (with region code) or 'en' (without region code).
   */
  private getLocale(): string {
    try {
      const preferencesState = this.#messenger.call(
        'PreferencesController:getState',
      );
      const currentLocale = preferencesState?.currentLocale || 'en-US';

      // Check if locale already has region code (XX-ZZ or XX_ZZ format)
      const hasRegionCode = /^[a-z]{2}[-_][a-z]{2}$/iu.test(currentLocale);

      // Only normalize if locale doesn't already have a region code
      return hasRegionCode ? currentLocale : getNormalisedLocale(currentLocale);
    } catch (error) {
      log.warn('Failed to get locale from PreferencesController:', error);
      try {
        const preferencesState = this.#messenger.call(
          'PreferencesController:getState',
        );
        return preferencesState?.currentLocale || 'en-US';
      } catch {
        return 'en-US';
      }
    }
  }

  /**
   * Make a request to the rewards API
   *
   * @param endpoint - The endpoint to request
   * @param options - The options for the request
   * @param subscriptionToken - The subscription context to use for the request, used for authenticated requests
   * @param timeoutMs - Custom timeout in milliseconds, defaults to DEFAULT_REQUEST_TIMEOUT_MS
   * @returns The response from the request
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    subscriptionToken?: string,
    timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add client identification header (matches web3_clientVersion format)
    try {
      const extensionPlatform = new ExtensionPlatform();
      const version = extensionPlatform.getVersion();
      headers['rewards-client-id'] = `extension-${version}`;
    } catch (error) {
      // Continue without client header if version retrieval fails
      console.warn('Failed to retrieve app version for client header:', error);
    }

    // Add bearer token for authenticated requests
    if (subscriptionToken) {
      headers['rewards-access-token'] = subscriptionToken;
    }

    // Add locale header for internationalization
    const locale = this.getLocale();
    if (locale) {
      headers['Accept-Language'] = locale;
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
   * Check if the error response is a 409 conflict with "already registered" message and throw AccountAlreadyRegisteredError if so.
   *
   * @param response - The HTTP response object
   * @param errorData - The parsed error data from the response
   * @param errorData.message
   * @private
   */
  private checkForAccountAlreadyRegisteredError(
    response: Response,
    errorData: { message?: string },
  ): void {
    if (
      response.status === 409 &&
      errorData?.message?.toLowerCase().includes('already registered')
    ) {
      throw new AccountAlreadyRegisteredError(
        errorData.message || 'Account is already registered',
      );
    }
  }

  /**
   * Perform login via signature for the current account.
   *
   * @param body - The login request body containing account, timestamp, and signature.
   * @param body.account
   * @param body.timestamp
   * @param body.signature
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

      this.checkForAccountAlreadyRegisteredError(response, errorData);

      throw new Error(`Login failed: ${response.status}`);
    }

    return (await response.json()) as LoginResponseDto;
  }

  /**
   * Estimate points for a given activity.
   *
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
   * Perform optin via signature for the current account.
   *
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

      this.checkForAccountAlreadyRegisteredError(response, errorData);

      throw new Error(`Optin failed: ${response.status}`);
    }

    return (await response.json()) as LoginResponseDto;
  }

  /**
   * Get season state for a specific season.
   *
   * @param seasonId - The ID of the season to get state for.
   * @param subscriptionToken - The subscription token for authentication.
   * @returns The season state DTO.
   */
  async getSeasonStatus(
    seasonId: string,
    subscriptionToken: string,
  ): Promise<SeasonStateDto> {
    const response = await this.makeRequest(
      `/seasons/${seasonId}/state`,
      {
        method: 'GET',
      },
      subscriptionToken,
    );

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData?.message?.includes('Rewards authorization failed')) {
        throw new AuthorizationFailedError(
          'Rewards authorization failed. Please login and try again.',
        );
      }

      if (errorData?.message?.includes('Season not found')) {
        throw new SeasonNotFoundError(
          'Season not found. Please try again with a different season.',
        );
      }

      throw new Error(`Get season state failed: ${response.status}`);
    }

    const data = await response.json();

    // Convert date strings to Date objects
    if (data.updatedAt) {
      data.updatedAt = new Date(data.updatedAt);
    }

    return data as SeasonStateDto;
  }

  /**
   * Fetch geolocation information from MetaMask's geolocation service.
   * Returns location in Country or Country-Region format (e.g., 'US', 'CA-ON', 'FR').
   *
   * @returns Promise<string> - The geolocation string or 'UNKNOWN' on failure.
   */
  async fetchGeoLocation(): Promise<string> {
    let location = 'UNKNOWN';

    try {
      const response = await this.#fetch(GEOLOCATION_URLS.PROD);

      if (!response.ok) {
        return location;
      }
      location = await response?.text();
      return location;
    } catch (e) {
      console.error('RewardsDataService: Failed to fetch geolocation', e);
      return location;
    }
  }

  /**
   * Validate a referral code.
   *
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
   *
   * @param body - The mobile login request body containing account, timestamp, and signature.
   * @param subscriptionToken - The subscription token to join the account to.
   * @returns Promise<SubscriptionDto> - The updated subscription information.
   */
  async mobileJoin(
    body: MobileLoginDto,
    subscriptionToken: string,
  ): Promise<SubscriptionDto> {
    const response = await this.makeRequest(
      '/wr/subscriptions/mobile-join',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      subscriptionToken,
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

      this.checkForAccountAlreadyRegisteredError(response, errorData);

      throw new Error(
        `Mobile join failed: ${response.status} ${errorData?.message || ''}`,
      );
    }

    return (await response.json()) as SubscriptionDto;
  }

  /**
   * Get opt-in status for multiple addresses.
   *
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
   * Get discover seasons information (current and next season).
   *
   * @returns The discover seasons DTO with current and next season information.
   */
  async getDiscoverSeasons(): Promise<DiscoverSeasonsDto> {
    const response = await this.makeRequest('/public/seasons/status', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Get discover seasons failed: ${response.status}`);
    }

    const data = await response.json();

    // Convert date strings to Date objects for current season
    if (data.current) {
      if (data.current.startDate) {
        data.current.startDate = new Date(data.current.startDate);
      }
      if (data.current.endDate) {
        data.current.endDate = new Date(data.current.endDate);
      }
    }

    // Convert date strings to Date objects for next season
    if (data.next) {
      if (data.next.startDate) {
        data.next.startDate = new Date(data.next.startDate);
      }
      if (data.next.endDate) {
        data.next.endDate = new Date(data.next.endDate);
      }
    }

    return data as DiscoverSeasonsDto;
  }

  /**
   * Get season metadata for a specific season.
   *
   * @param seasonId - The ID of the season to get metadata for.
   * @returns The season metadata DTO.
   */
  async getSeasonMetadata(seasonId: string): Promise<SeasonMetadataDto> {
    const response = await this.makeRequest(
      `/public/seasons/${seasonId}/meta`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new Error(`Get season metadata failed: ${response.status}`);
    }

    const data = await response.json();

    // Convert date strings to Date objects
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    return data as SeasonMetadataDto;
  }
}
