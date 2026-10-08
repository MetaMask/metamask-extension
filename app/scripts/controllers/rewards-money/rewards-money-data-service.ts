import log from 'loglevel';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { getNormalizedLocale } from '../../../../shared/constants/locales';
import { REWARDS_MONEY_API_URL } from '../../../../shared/constants/rewards';
import ExtensionPlatform from '../../platforms/extension';
import type {
  ReferralMeDto,
  RegisterRefereeDto,
} from '../../../../shared/types/rewards-money';
import {
  REWARDS_MONEY_DATA_SERVICE_NAME,
  type RewardsMoneyDataServiceMessenger,
} from './rewards-money-data-service-types';

/**
 * The Rewards Money API rejected the bearer token, or none was available.
 */
export class RewardsMoneyAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RewardsMoneyAuthorizationError';
  }
}

/**
 * A non-OK Rewards Money response whose status and body the caller acts on.
 * `data` is copied onto the error so it survives the background RPC boundary.
 */
export class RewardsMoneyHttpError extends Error {
  readonly status: number;

  readonly bodyText: string | undefined;

  readonly data: { status: number; bodyText?: string };

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = 'RewardsMoneyHttpError';
    this.status = status;
    this.bodyText = bodyText;
    this.data = { status, bodyText };
  }
}

const MESSENGER_EXPOSED_METHODS = [
  'getReferralMe',
  'validateReferralCode',
  'registerReferee',
] as const;

const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

/**
 * HTTP client for the Rewards Money referral endpoints the invite sheet uses.
 */
export class RewardsMoneyDataService {
  readonly name: typeof REWARDS_MONEY_DATA_SERVICE_NAME =
    REWARDS_MONEY_DATA_SERVICE_NAME;

  readonly #messenger: RewardsMoneyDataServiceMessenger;

  readonly #fetch: typeof fetch;

  readonly #rewardsMoneyApiUrl: string;

  constructor({
    messenger,
    fetch: fetchFunction,
  }: {
    messenger: RewardsMoneyDataServiceMessenger;
    fetch: typeof fetch;
  }) {
    this.#messenger = messenger;
    this.#fetch = fetchFunction;
    this.#rewardsMoneyApiUrl = getRewardsMoneyApiBaseUrl();
    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  /**
   * Loads the signed-in profile's referral persona, copy, and excluded regions.
   *
   * @returns The referral-me payload.
   */
  async getReferralMe(): Promise<ReferralMeDto> {
    const response = await this.#makeRequest('/referral/me', { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Get referral me failed: ${response.status}`);
    }
    return (await response.json()) as ReferralMeDto;
  }

  /**
   * Public code check. Never attaches Authorization.
   *
   * @param code - The referral code to validate.
   * @returns Whether the server accepts the code.
   */
  async validateReferralCode(code: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams();
    params.append('code', code);
    const response = await this.#makeRequest(
      `/referral/validate?${params.toString()}`,
      { method: 'GET' },
      DEFAULT_REQUEST_TIMEOUT_MS,
      false,
    );
    if (!response.ok) {
      throw new Error(`Validate referral code failed: ${response.status}`);
    }
    return (await response.json()) as { success: boolean };
  }

  /**
   * Enrols the session profile under a referrer's code.
   *
   * @param params - The referral code. The referee is the bearer profile.
   */
  async registerReferee(params: RegisterRefereeDto): Promise<void> {
    const response = await this.#makeRequest('/wr/referral/referee', {
      method: 'POST',
      body: JSON.stringify({ code: params.code }),
    });
    if (!response.ok) {
      let bodyText: string | undefined;
      try {
        bodyText = await response.text();
      } catch {
        bodyText = undefined;
      }
      throw new RewardsMoneyHttpError(
        `Register referee failed: ${response.status}`,
        response.status,
        bodyText,
      );
    }
  }

  async #makeRequest(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
    authenticated: boolean = true,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const extensionPlatform = new ExtensionPlatform();
      headers['rewards-client-id'] =
        `extension-${extensionPlatform.getVersion()}`;
    } catch (error) {
      log.warn(
        'RewardsMoneyDataService: failed to read app version',
        error instanceof Error ? error.message : String(error),
      );
    }

    if (authenticated) {
      const token = await this.#messenger.call(
        'AuthenticationController:getBearerToken',
      );
      if (!token) {
        throw new RewardsMoneyAuthorizationError(
          'No bearer token available for the Rewards Money API',
        );
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const locale = this.#getLocale();
    if (locale) {
      headers['Accept-Language'] = locale;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.#fetch(
        `${this.#rewardsMoneyApiUrl}${endpoint}`,
        {
          credentials: 'omit',
          ...options,
          headers: { ...headers, ...options.headers },
          signal: controller.signal,
        },
      );

      if (authenticated && response.status === 401) {
        throw new RewardsMoneyAuthorizationError(
          `Authorization failed: ${response.status}`,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  #getLocale(): string {
    try {
      const preferencesState = this.#messenger.call(
        'PreferencesController:getState',
      );
      const currentLocale = preferencesState?.currentLocale || 'en-US';
      const hasRegionCode = /^[a-z]{2}[-_][a-z]{2}$/iu.test(currentLocale);
      return hasRegionCode ? currentLocale : getNormalizedLocale(currentLocale);
    } catch (error) {
      log.warn(
        'RewardsMoneyDataService: failed to read locale',
        error instanceof Error ? error.message : String(error),
      );
      return 'en-US';
    }
  }
}

/**
 * Resolves the Rewards Money API base URL for this build.
 *
 * `REWARDS_MONEY_API_URL` wins when set. Production and release-candidate
 * builds use PRD, staging uses UAT, and local or test builds use DEV.
 *
 * @returns The API origin, without a trailing slash.
 */
export function getRewardsMoneyApiBaseUrl(): string {
  if (process.env.REWARDS_MONEY_API_URL) {
    return process.env.REWARDS_MONEY_API_URL.replace(/\/+$/u, '');
  }

  switch (process.env.METAMASK_ENVIRONMENT) {
    case ENVIRONMENT.PRODUCTION:
    case ENVIRONMENT.RELEASE_CANDIDATE:
      return REWARDS_MONEY_API_URL.PRD;
    case ENVIRONMENT.STAGING:
      return REWARDS_MONEY_API_URL.UAT;
    case ENVIRONMENT.DEVELOPMENT:
    case ENVIRONMENT.TESTING:
    case ENVIRONMENT.PULL_REQUEST:
    case ENVIRONMENT.OTHER:
    default:
      return REWARDS_MONEY_API_URL.DEV;
  }
}
