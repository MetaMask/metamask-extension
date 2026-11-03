import { PERPS_ERROR_CODES } from '@metamask/perps-controller';
import type {
  PerpsErrorCode,
  PerpsErrorDetails,
} from '@metamask/perps-controller';

export type PerpsErrorInput = {
  error: string;
  errorCode?: PerpsErrorCode;
  errorDetails?: PerpsErrorDetails;
  maxSlippageBps?: number;
};

type PerpsTranslation = (key: string, substitutions?: string[]) => string;

const formatBpsAsPercent = (bps: number): string =>
  (Math.round(bps) / 100).toString();

function normalizePerpsError(error: unknown): PerpsErrorInput | null {
  if (typeof error === 'string') {
    return { error };
  }

  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const errorRecord = error as Record<string, unknown>;
  let message: string | null = null;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof errorRecord.error === 'string') {
    message = errorRecord.error;
  }
  if (message === null) {
    return null;
  }

  const errorCodeValue = errorRecord.errorCode ?? errorRecord.code;
  const errorCode = isPerpsErrorCodeValue(errorCodeValue)
    ? errorCodeValue
    : undefined;
  const errorDetails =
    typeof errorRecord.errorDetails === 'object' &&
    errorRecord.errorDetails !== null
      ? (errorRecord.errorDetails as PerpsErrorDetails)
      : undefined;
  const maxSlippageBps =
    typeof errorRecord.maxSlippageBps === 'number'
      ? errorRecord.maxSlippageBps
      : undefined;

  return {
    error: message,
    errorCode,
    errorDetails,
    maxSlippageBps,
  };
}

function getErrorCode(error: PerpsErrorInput): PerpsErrorCode | undefined {
  return (
    error.errorCode ??
    (isPerpsErrorCodeValue(error.error) ? error.error : undefined)
  );
}

function getErrorTranslation({
  errorCode,
  errorDetails,
  maxSlippageBps,
  defaultI18nKey,
}: {
  errorCode: PerpsErrorCode;
  errorDetails?: PerpsErrorDetails;
  maxSlippageBps?: number;
  defaultI18nKey: string;
}): { i18nKey: string; substitutions?: string[] } {
  if (errorCode === PERPS_ERROR_CODES.PRICE_MOVED) {
    if (
      errorDetails?.code === PERPS_ERROR_CODES.PRICE_MOVED &&
      Number.isFinite(errorDetails.priceDeltaBps) &&
      Number.isFinite(errorDetails.maxSlippageBps)
    ) {
      return {
        i18nKey: 'perpsPriceMoved',
        substitutions: [
          formatBpsAsPercent(errorDetails.priceDeltaBps),
          formatBpsAsPercent(errorDetails.maxSlippageBps),
        ],
      };
    }

    return { i18nKey: 'perpsSlippageExceeded' };
  }

  if (errorCode === PERPS_ERROR_CODES.IOC_CANCEL) {
    return maxSlippageBps === undefined
      ? { i18nKey: 'perpsIocCancelUnknownTolerance' }
      : {
          i18nKey: 'perpsIocCancel',
          substitutions: [formatBpsAsPercent(maxSlippageBps)],
        };
  }

  return { i18nKey: defaultI18nKey };
}

/**
 * Maps PerpsErrorCode values to extension i18n message keys.
 * Keys that fall through to `somethingWentWrong` do not have
 * user-meaningful distinctions beyond a generic failure message.
 */
export const ERROR_CODE_TO_I18N_KEY = {
  // Client lifecycle
  [PERPS_ERROR_CODES.CLIENT_NOT_INITIALIZED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.CLIENT_REINITIALIZING]: 'somethingWentWrong',

  // Provider / token
  [PERPS_ERROR_CODES.PROVIDER_NOT_AVAILABLE]: 'somethingWentWrong',
  // Routing failures across the controller's multi-provider layer. The
  // extension exposes no provider picker, so neither is user-actionable.
  [PERPS_ERROR_CODES.PROVIDER_NOT_FOUND]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.PROVIDER_LIFECYCLE_STALE]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.TOKEN_NOT_SUPPORTED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.BRIDGE_CONTRACT_NOT_FOUND]: 'somethingWentWrong',

  // Data fetch failures
  [PERPS_ERROR_CODES.WITHDRAW_FAILED]: 'perpsWithdrawFailed',
  [PERPS_ERROR_CODES.POSITIONS_FAILED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.ACCOUNT_STATE_FAILED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.MARKETS_FAILED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.UNKNOWN_ERROR]: 'somethingWentWrong',

  // Order errors
  [PERPS_ERROR_CODES.ORDER_LEVERAGE_REDUCTION_FAILED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.IOC_CANCEL]: 'perpsIocCancel',

  // Connection
  [PERPS_ERROR_CODES.CONNECTION_TIMEOUT]: 'perpsConnectionTimeout',

  // Withdraw validation
  [PERPS_ERROR_CODES.WITHDRAW_ASSET_ID_REQUIRED]: 'perpsWithdrawInvalidAmount',
  [PERPS_ERROR_CODES.WITHDRAW_AMOUNT_REQUIRED]: 'perpsWithdrawInvalidAmount',
  [PERPS_ERROR_CODES.WITHDRAW_AMOUNT_POSITIVE]: 'perpsWithdrawInvalidAmount',
  [PERPS_ERROR_CODES.WITHDRAW_INVALID_DESTINATION]:
    'perpsWithdrawInvalidAddress',
  [PERPS_ERROR_CODES.WITHDRAW_ASSET_NOT_SUPPORTED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.WITHDRAW_INSUFFICIENT_BALANCE]:
    'perpsWithdrawInsufficient',

  // Deposit validation
  [PERPS_ERROR_CODES.DEPOSIT_ASSET_ID_REQUIRED]: 'perpsDepositFailed',
  [PERPS_ERROR_CODES.DEPOSIT_AMOUNT_REQUIRED]: 'perpsDepositFailed',
  [PERPS_ERROR_CODES.DEPOSIT_AMOUNT_POSITIVE]: 'perpsDepositFailed',
  [PERPS_ERROR_CODES.DEPOSIT_MINIMUM_AMOUNT]: 'perpsDepositFailed',

  // Order validation
  [PERPS_ERROR_CODES.ORDER_COIN_REQUIRED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_LIMIT_PRICE_REQUIRED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_PRICE_POSITIVE]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_UNKNOWN_COIN]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SIZE_POSITIVE]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_PRICE_REQUIRED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SIZE_MIN]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_LEVERAGE_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_LEVERAGE_BELOW_POSITION]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_MAX_VALUE_EXCEEDED]: 'perpsOrderFailed',

  // Order validation — trigger placements and partial TP/SL. The extension
  // places neither today, so these are unreachable from its UI and share the
  // generic `ORDER_*` copy rather than carrying bespoke strings.
  [PERPS_ERROR_CODES.ORDER_TRIGGER_PRICE_REQUIRED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TRIGGER_PRICE_POSITIVE]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TRIGGER_PRICE_NOT_SUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TRIGGER_TPSL_UNSUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TPSL_SIZE_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TPSL_LINKAGE_CONFLICT]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TPSL_POSITION_LINKAGE_UNSUPPORTED]:
    'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TPSL_LINKAGE_REQUIRED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TIME_IN_FORCE_NOT_SUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_EDIT_TRIGGER_UNSUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_EDIT_ORDER_UNVERIFIABLE]: 'perpsOrderFailed',

  // Order validation — strategy placements (`twap`, `scale`, `chase`). Same
  // reasoning as the trigger block above: the extension's order form places
  // only market and limit orders, so nothing in its UI can produce a strategy
  // request and none of these codes is reachable from it. They share the
  // generic `ORDER_*` copy rather than carrying a bespoke string per code that
  // every locale would have to translate for a flow that does not exist.
  // `ORDER_STRATEGY_HANDLE_UNKNOWN` and `ORDER_STRATEGY_CANCEL_INCOMPLETE`
  // arrive on the cancel path, where `CANCEL_ORDER_I18N_KEY_OVERRIDES` already
  // remaps `perpsOrderFailed` to the cancel wording.
  [PERPS_ERROR_CODES.ORDER_STRATEGY_PARAMS_NOT_SUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_STRATEGY_FIELD_UNSUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_STRATEGY_MARKET_UNSUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_STRATEGY_ROUTE_UNAVAILABLE]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_STRATEGY_HANDLE_UNKNOWN]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_STRATEGY_CANCEL_INCOMPLETE]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_EDIT_STRATEGY_UNSUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TWAP_DURATION_REQUIRED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TWAP_DURATION_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_TWAP_NOTIONAL_TOO_SMALL]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SCALE_RANGE_REQUIRED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SCALE_RANGE_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SCALE_COUNT_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SCALE_SIZE_TOO_SMALL]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SCALE_NOTIONAL_TOO_SMALL]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_SCALE_PREVIEW_STALE]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_CHASE_INTERVAL_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_CHASE_DURATION_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_CHASE_MAX_DISTANCE_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_CHASE_LIMIT_REACHED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_CHASE_ABANDONED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_CHASE_TOUCH_UNAVAILABLE]: 'perpsOrderFailed',
  // Isolated/cross margin-mode selection. The extension order form does not
  // send `marginMode`, so these codes are unreachable from its UI today.
  [PERPS_ERROR_CODES.ORDER_MARGIN_MODE_INVALID]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_MARGIN_MODE_UNSUPPORTED]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_MARGIN_MODE_POSITION_OPEN]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.ORDER_MARGIN_MODE_ORDER_OPEN]: 'perpsOrderFailed',

  // HyperLiquid client errors
  [PERPS_ERROR_CODES.EXCHANGE_CLIENT_NOT_AVAILABLE]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.INFO_CLIENT_NOT_AVAILABLE]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.SUBSCRIPTION_CLIENT_NOT_AVAILABLE]: 'somethingWentWrong',

  // HyperLiquid exchange rejections
  // The wallet has no HyperLiquid account yet — HyperLiquid creates one on the
  // first USDC credit, so the only way forward is to fund it. This has its own
  // key rather than reusing `perpsAddFundsDescription`: that string belongs to
  // the balance-actions empty state, and rewording it there should not silently
  // reword an error message.
  [PERPS_ERROR_CODES.EXCHANGE_ACCOUNT_NOT_FOUND]:
    'perpsExchangeAccountNotFound',
  // Account needs a multi-sig wrapper for exchange writes — not actionable here.
  [PERPS_ERROR_CODES.EXCHANGE_MULTI_SIG_REQUIRED]: 'somethingWentWrong',
  // Stale or reused action nonce; retrying is what resolves it.
  [PERPS_ERROR_CODES.EXCHANGE_INVALID_NONCE]: 'perpsOrderFailed',

  // Wallet / account
  [PERPS_ERROR_CODES.NO_ACCOUNT_SELECTED]: 'perpsWithdrawNoAccount',
  // KEYRING_LOCKED is handled silently and never surfaced to the user
  [PERPS_ERROR_CODES.KEYRING_LOCKED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.INVALID_ADDRESS_FORMAT]: 'perpsWithdrawInvalidAddress',

  // Transfer / swap
  [PERPS_ERROR_CODES.TRANSFER_FAILED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.SWAP_FAILED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.SPOT_PAIR_NOT_FOUND]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.PRICE_UNAVAILABLE]: 'somethingWentWrong',

  // Market / collateral
  [PERPS_ERROR_CODES.UNSUPPORTED_COLLATERAL]: 'perpsUnsupportedCollateral',

  // Batch operations
  [PERPS_ERROR_CODES.BATCH_CANCEL_FAILED]: 'perpsBatchCancelFailed',
  [PERPS_ERROR_CODES.BATCH_CLOSE_FAILED]: 'perpsBatchCloseFailed',

  // Position / margin
  [PERPS_ERROR_CODES.INSUFFICIENT_MARGIN]: 'perpsInsufficientMargin',
  [PERPS_ERROR_CODES.INSUFFICIENT_BALANCE]: 'perpsWithdrawInsufficient',
  [PERPS_ERROR_CODES.REDUCE_ONLY_VIOLATION]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.POSITION_WOULD_FLIP]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.POSITION_NOT_FOUND]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.MARGIN_ADJUSTMENT_FAILED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.TPSL_UPDATE_FAILED]: 'somethingWentWrong',
  // The controller could not keep the position's TP/SL triggers in place. The
  // user cannot re-arm them from the error toast, so it shares the generic copy
  // with the update failure above.
  [PERPS_ERROR_CODES.TPSL_PROTECTION_LOST]: 'somethingWentWrong',

  // Order execution
  [PERPS_ERROR_CODES.ORDER_REJECTED]: 'perpsOrderRejected',
  [PERPS_ERROR_CODES.SLIPPAGE_EXCEEDED]: 'perpsSlippageExceeded',
  [PERPS_ERROR_CODES.PRICE_MOVED]: 'perpsPriceMoved',
  [PERPS_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'perpsRateLimitExceeded',

  // Network / service
  [PERPS_ERROR_CODES.SERVICE_UNAVAILABLE]: 'perpsServiceUnavailable',
  [PERPS_ERROR_CODES.NETWORK_ERROR]: 'perpsNetworkError',
  // `as const satisfies` rather than a `Record<PerpsErrorCode, string>`
  // annotation: the annotation widens every value to `string`, which would let
  // `CANCEL_ORDER_I18N_KEY_OVERRIDES` below key off a message key that no longer
  // exists here without a compile error. `satisfies` alone is not enough — the
  // keys are computed, so TS falls back to an index signature and re-widens the
  // values. Exhaustiveness over `PerpsErrorCode` is unchanged.
} as const satisfies Record<PerpsErrorCode, string>;

function isPerpsErrorCodeValue(value: unknown): value is PerpsErrorCode {
  return (
    typeof value === 'string' && Object.hasOwn(ERROR_CODE_TO_I18N_KEY, value)
  );
}

/**
 * Cancel-flow remapping of the keys above.
 *
 * Every `ORDER_*` code funnels into `perpsOrderFailed` ("Order could not be
 * placed."), which is the wrong verb on a screen where the user just pressed
 * Cancel order — `ORDER_UNKNOWN_COIN` reaches it through the cancel retry.
 * Remapping the resolved key rather than enumerating codes keeps this correct
 * as the controller adds more `ORDER_*` codes.
 */
export const CANCEL_ORDER_I18N_KEY_OVERRIDES: Partial<
  Record<(typeof ERROR_CODE_TO_I18N_KEY)[PerpsErrorCode], string>
> = {
  perpsOrderFailed: 'perpsCancelOrderFailed',
};

/**
 * Regex patterns that match raw HyperLiquid API error strings to a PerpsErrorCode.
 * These are protocol-specific (not platform-specific) and should stay in sync with mobile.
 * Listed in priority order — first match wins.
 */
export const API_ERROR_PATTERNS: {
  pattern: RegExp;
  code: PerpsErrorCode;
}[] = [
  // Order execution
  {
    pattern: /insufficient margin/iu,
    code: PERPS_ERROR_CODES.INSUFFICIENT_MARGIN,
  },
  {
    pattern: /insufficient balance/iu,
    code: PERPS_ERROR_CODES.INSUFFICIENT_BALANCE,
  },
  { pattern: /order rejected/iu, code: PERPS_ERROR_CODES.ORDER_REJECTED },
  { pattern: /ioc cancel/iu, code: PERPS_ERROR_CODES.IOC_CANCEL },
  {
    pattern: /insufficient liquidity/iu,
    code: PERPS_ERROR_CODES.IOC_CANCEL,
  },
  { pattern: /reduce only/iu, code: PERPS_ERROR_CODES.REDUCE_ONLY_VIOLATION },
  { pattern: /would flip/iu, code: PERPS_ERROR_CODES.POSITION_WOULD_FLIP },
  { pattern: /slippage/iu, code: PERPS_ERROR_CODES.SLIPPAGE_EXCEEDED },
  // Rate limiting
  { pattern: /rate limit/iu, code: PERPS_ERROR_CODES.RATE_LIMIT_EXCEEDED },
  {
    pattern: /too many requests/iu,
    code: PERPS_ERROR_CODES.RATE_LIMIT_EXCEEDED,
  },
  // Leverage
  {
    pattern: /leverage.*reduction/iu,
    code: PERPS_ERROR_CODES.ORDER_LEVERAGE_REDUCTION_FAILED,
  },
  {
    pattern: /leverage.*below.*position/iu,
    code: PERPS_ERROR_CODES.ORDER_LEVERAGE_BELOW_POSITION,
  },
  {
    pattern: /invalid leverage/iu,
    code: PERPS_ERROR_CODES.ORDER_LEVERAGE_INVALID,
  },
  // Size / notional
  { pattern: /min.*notional/iu, code: PERPS_ERROR_CODES.ORDER_SIZE_MIN },
  {
    pattern: /max.*value.*exceeded/iu,
    code: PERPS_ERROR_CODES.ORDER_MAX_VALUE_EXCEEDED,
  },
  // Service / network
  {
    pattern: /service.*unavailable/iu,
    code: PERPS_ERROR_CODES.SERVICE_UNAVAILABLE,
  },
  {
    pattern: /connection.*timed? out/iu,
    code: PERPS_ERROR_CODES.CONNECTION_TIMEOUT,
  },
  { pattern: /network.*error/iu, code: PERPS_ERROR_CODES.NETWORK_ERROR },
  // Unknown coin
  {
    pattern: /unknown.*coin|asset.*not.*found/iu,
    code: PERPS_ERROR_CODES.ORDER_UNKNOWN_COIN,
  },
];

/**
 * Translate a Perps error to a user-facing string using the extension i18n system.
 *
 * Accepts strings, Error instances, and structured `PerpsErrorInput` objects.
 * Structured codes take precedence over message-as-code values and legacy API
 * pattern matching. IOC cancellation includes the submitted tolerance when
 * available, and price-movement errors include the measured delta and maximum
 * tolerance when Core supplies complete details. Missing interpolation data
 * uses substitution-free fallback copy. Unknown errors return `null`.
 *
 * @param error - The unknown thrown value.
 * @param t - The extension i18n translation function from `useI18nContext()`.
 * @param i18nKeyOverrides - Optional flow-specific remapping of the resolved
 * message key, e.g. `CANCEL_ORDER_I18N_KEY_OVERRIDES`.
 * @returns A translated user-facing string, or `null` if no specific translation found.
 */
export function translatePerpsError(
  error: unknown,
  t: PerpsTranslation,
  i18nKeyOverrides?: Partial<Record<string, string>>,
): string | null {
  const translate = (i18nKey: string, substitutions?: string[]) =>
    t(i18nKeyOverrides?.[i18nKey] ?? i18nKey, substitutions);
  const normalizedError = normalizePerpsError(error);
  if (!normalizedError) {
    return null;
  }

  // 1. Prefer the structured code, then support an error code used as the
  // message for older callers.
  const errorCode = getErrorCode(normalizedError);
  if (errorCode) {
    const { i18nKey, substitutions } = getErrorTranslation({
      errorCode,
      errorDetails: normalizedError.errorDetails,
      maxSlippageBps: normalizedError.maxSlippageBps,
      defaultI18nKey: ERROR_CODE_TO_I18N_KEY[errorCode],
    });
    return translate(i18nKey, substitutions);
  }

  // 2. Pattern match against raw error messages from older controller versions.
  for (const { pattern, code } of API_ERROR_PATTERNS) {
    if (pattern.test(normalizedError.error)) {
      const { i18nKey, substitutions } = getErrorTranslation({
        errorCode: code,
        maxSlippageBps: normalizedError.maxSlippageBps,
        defaultI18nKey: ERROR_CODE_TO_I18N_KEY[code],
      });
      return translate(i18nKey, substitutions);
    }
  }

  // 3. No match
  return null;
}

/**
 * Check an error value for a specific structured or legacy Perps error code.
 *
 * @param error - The unknown error value.
 * @param code - The Perps error code to match.
 * @returns Whether the error has the requested code.
 */
export function isPerpsErrorCode(
  error: unknown,
  code: PerpsErrorCode,
): boolean {
  const normalizedError = normalizePerpsError(error);
  return normalizedError ? getErrorCode(normalizedError) === code : false;
}

/**
 * Check whether an error is caused by a market-order slippage guard.
 *
 * @param error - The unknown error value.
 * @returns Whether the error represents a slippage-related failure.
 */
export function isSlippageFailure(error: unknown): boolean {
  return (
    isPerpsErrorCode(error, PERPS_ERROR_CODES.PRICE_MOVED) ||
    isPerpsErrorCode(error, PERPS_ERROR_CODES.IOC_CANCEL) ||
    isPerpsErrorCode(error, PERPS_ERROR_CODES.SLIPPAGE_EXCEEDED)
  );
}

/**
 * Context-aware error handler that always returns a user-facing string.
 *
 * If `translatePerpsError` finds a specific translation it returns that;
 * otherwise it falls back to `somethingWentWrong`.
 *
 * @param error - The unknown thrown value.
 * @param t - The extension i18n translation function from `useI18nContext()`.
 * @returns A translated user-facing error string.
 */
export function handlePerpsError(error: unknown, t: PerpsTranslation): string {
  return translatePerpsError(error, t) ?? t('somethingWentWrong');
}
