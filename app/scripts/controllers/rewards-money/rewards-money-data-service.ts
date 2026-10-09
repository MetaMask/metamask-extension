import log from 'loglevel';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { getNormalizedLocale } from '../../../../shared/constants/locales';
import { REWARDS_MONEY_API_URL } from '../../../../shared/constants/rewards';
import ExtensionPlatform from '../../platforms/extension';
import type {
  RebateQuoteBody,
  RebateQuoteResponse,
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
/**
 * Why `POST /earnings/rebate/quote` did not return a quote. A 200 whose
 * `reason` is set is not this: that quote is the answer, and the screen
 * shows no row. These are the responses the screen has to tell apart.
 */
export type RewardsMoneyRebateQuoteFailure =
  | 'INVALID_REQUEST'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'FAILED';

/**
 * A rebate quote the server refused. `failure` is the status the confirmation
 * screen branches on; `detail` is the server's message when it sent one.
 * `401` is not this: that is {@link RewardsMoneyAuthorizationError}.
 *
 * A pod that sheds the quote answers `503` with
 * `{ reason: 'SERVER_BUSY', message: 'Server busy, retry shortly' }` and
 * `Retry-After: 2`. That is `failure: 'UNAVAILABLE'`, that message as
 * `detail`, and `retryAfterSeconds` from the header. Show no rebate row, do
 * not request another quote for this screen, and leave the button disabled
 * until `retryAfterSeconds` has elapsed.
 *
 * `failure` and `retryAfterSeconds` are copied onto `data` so they survive
 * the background RPC boundary, same as {@link RewardsMoneyHttpError}.
 */
export class RewardsMoneyRebateQuoteError extends Error {
  readonly status: number;

  readonly failure: RewardsMoneyRebateQuoteFailure;

  /** Nest `message`, or `reason` when that is all the body carries. */
  readonly detail: string | undefined;

  /** Seconds from a `Retry-After` header, when the refusal carried one. */
  readonly retryAfterSeconds: number | undefined;

  /**
   * Fields the UI can read after `serializeError`. `retryAfterSeconds` is
   * omitted when the refusal had no usable `Retry-After`, because `undefined`
   * makes the bag fail the JSON check and the whole object is dropped.
   */
  readonly data: {
    failure: RewardsMoneyRebateQuoteFailure;
    retryAfterSeconds?: number;
  };

  constructor(
    status: number,
    failure: RewardsMoneyRebateQuoteFailure,
    detail?: string,
    retryAfterSeconds?: number,
  ) {
    super(
      detail && detail.length > 0
        ? detail
        : `Get rebate quote failed: ${status}`,
    );
    this.name = 'RewardsMoneyRebateQuoteError';
    this.status = status;
    this.failure = failure;
    this.detail = detail;
    this.retryAfterSeconds = retryAfterSeconds;
    this.data =
      retryAfterSeconds === undefined
        ? { failure }
        : { failure, retryAfterSeconds };
  }
}

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
  'getRebateQuote',
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

  /**
   * What rebate, if any, a confirmation screen shows. Writes nothing. The
   * profile is the bearer token's; the body never names one.
   *
   * A refusal, or a `200` whose body is not a quote, rejects with
   * {@link RewardsMoneyRebateQuoteError}; a `401` with
   * {@link RewardsMoneyAuthorizationError}. A timeout or a network failure
   * rejects with a plain `Error`.
   *
   * @param body - The product and, for swaps, the fee leg of the quote.
   * @returns The rebate quote.
   */
  async getRebateQuote(body: RebateQuoteBody): Promise<RebateQuoteResponse> {
    const response = await this.#makeRequest('/earnings/rebate/quote', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        bodyText = '';
      }
      throw new RewardsMoneyRebateQuoteError(
        response.status,
        rebateQuoteFailure(response.status),
        rebateQuoteDetail(bodyText),
        parseRetryAfterSeconds(response.headers.get('retry-after')),
      );
    }

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      parsed = undefined;
    }
    if (!isRebateQuoteResponse(parsed)) {
      throw new RewardsMoneyRebateQuoteError(
        response.status,
        'FAILED',
        'Malformed rebate quote response',
      );
    }
    return parsed;
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

/**
 * `Retry-After` is delta-seconds. An HTTP-date is accepted too.
 *
 * @param header - The `Retry-After` header value, when the response sent one.
 * @returns Seconds to wait, or undefined when the header is absent or unreadable.
 */
function parseRetryAfterSeconds(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.max(1, Math.ceil(seconds));
  }
  const at = Date.parse(header);
  if (Number.isNaN(at)) {
    return undefined;
  }
  return Math.max(1, Math.ceil((at - Date.now()) / 1000));
}

/**
 * The quote failures a confirmation screen branches on. Anything else,
 * including a 500, stays `FAILED` so a shed is not reported as a validation
 * error. HTTP 503 is `UNAVAILABLE`; the body reason for that shed is
 * `SERVER_BUSY`.
 *
 * @param status - The HTTP status of the refused quote.
 * @returns The failure a confirmation screen branches on.
 */
function rebateQuoteFailure(status: number): RewardsMoneyRebateQuoteFailure {
  if (status === 400) {
    return 'INVALID_REQUEST';
  }
  if (status === 429) {
    return 'RATE_LIMITED';
  }
  if (status === 503) {
    return 'UNAVAILABLE';
  }
  return 'FAILED';
}

/**
 * Whether a `200` body has the fields a confirmation screen reads. A cheap
 * shape check, so an unexpected body is a `FAILED` quote rather than a row
 * showing `undefined`.
 *
 * @param value - The parsed `200` body.
 * @returns Whether the body has the fields a confirmation screen reads.
 */
function isRebateQuoteResponse(value: unknown): value is RebateQuoteResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const quote = value as Record<string, unknown>;
  return (
    typeof quote.product === 'string' &&
    typeof quote.eligible === 'boolean' &&
    typeof quote.rebateBips === 'number' &&
    Number.isFinite(quote.rebateBips) &&
    (quote.reason === null || typeof quote.reason === 'string')
  );
}

/**
 * Nest sends `message` as a string or a list. A rate limit sends `reason`
 * beside that message. A body that is not JSON still leaves the status.
 *
 * @param bodyText - The raw error body.
 * @returns Nest `message`, or `reason` when that is all the body carries.
 */
function rebateQuoteDetail(bodyText: string): string | undefined {
  if (bodyText.length === 0) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(bodyText) as {
      message?: unknown;
      reason?: unknown;
    };
    if (typeof parsed.message === 'string' && parsed.message.length > 0) {
      return parsed.message;
    }
    if (Array.isArray(parsed.message)) {
      const messages = parsed.message.filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      );
      if (messages.length > 0) {
        return messages.join('; ');
      }
    }
    if (typeof parsed.reason === 'string' && parsed.reason.length > 0) {
      return parsed.reason;
    }
  } catch {
    // A non-JSON body still classifies by status.
  }
  return undefined;
}
