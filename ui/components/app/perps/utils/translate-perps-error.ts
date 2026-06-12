import { PERPS_ERROR_CODES } from '@metamask/perps-controller';
import type { PerpsErrorCode } from '@metamask/perps-controller';

/**
 * Maps PerpsErrorCode values to extension i18n message keys.
 * Keys that fall through to `somethingWentWrong` do not have
 * user-meaningful distinctions beyond a generic failure message.
 */
export const ERROR_CODE_TO_I18N_KEY: Record<PerpsErrorCode, string> = {
  // Client lifecycle
  [PERPS_ERROR_CODES.CLIENT_NOT_INITIALIZED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.CLIENT_REINITIALIZING]: 'somethingWentWrong',

  // Provider / token
  [PERPS_ERROR_CODES.PROVIDER_NOT_AVAILABLE]: 'somethingWentWrong',
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
  [PERPS_ERROR_CODES.IOC_CANCEL]: 'perpsOrderFailed',

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

  // HyperLiquid client errors
  [PERPS_ERROR_CODES.EXCHANGE_CLIENT_NOT_AVAILABLE]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.INFO_CLIENT_NOT_AVAILABLE]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.SUBSCRIPTION_CLIENT_NOT_AVAILABLE]: 'somethingWentWrong',

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

  // Batch operations
  [PERPS_ERROR_CODES.BATCH_CANCEL_FAILED]: 'perpsBatchCancelFailed',
  [PERPS_ERROR_CODES.BATCH_CLOSE_FAILED]: 'perpsBatchCloseFailed',

  // Position / margin
  [PERPS_ERROR_CODES.INSUFFICIENT_MARGIN]: 'perpsInsufficientMargin',
  [PERPS_ERROR_CODES.INSUFFICIENT_BALANCE]: 'perpsWithdrawInsufficient',
  [PERPS_ERROR_CODES.REDUCE_ONLY_VIOLATION]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.POSITION_WOULD_FLIP]: 'perpsOrderFailed',
  [PERPS_ERROR_CODES.MARGIN_ADJUSTMENT_FAILED]: 'somethingWentWrong',
  [PERPS_ERROR_CODES.TPSL_UPDATE_FAILED]: 'somethingWentWrong',

  // Order execution
  [PERPS_ERROR_CODES.ORDER_REJECTED]: 'perpsOrderRejected',
  [PERPS_ERROR_CODES.SLIPPAGE_EXCEEDED]: 'perpsSlippageExceeded',
  [PERPS_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'perpsRateLimitExceeded',

  // Network / service
  [PERPS_ERROR_CODES.SERVICE_UNAVAILABLE]: 'perpsServiceUnavailable',
  [PERPS_ERROR_CODES.NETWORK_ERROR]: 'perpsNetworkError',
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
 * Resolution order:
 * 1. If the error has a `code` property matching a known PerpsErrorCode, use
 * `ERROR_CODE_TO_I18N_KEY` to look up the message key.
 * 2. If the error message itself is a known PerpsErrorCode string, use it directly.
 * 3. If the error message matches an API error pattern, use the mapped code's key.
 * 4. Fall back to `null` (caller should show a generic fallback).
 *
 * @param error - The unknown thrown value.
 * @param t - The extension i18n translation function from `useI18nContext()`.
 * @returns A translated user-facing string, or `null` if no specific translation found.
 */
export function translatePerpsError(
  error: unknown,
  t: (key: string) => string,
): string | null {
  const errorObj = error instanceof Error ? error : null;
  const errorCode =
    errorObj &&
    'code' in errorObj &&
    typeof (errorObj as { code?: unknown }).code === 'string'
      ? (errorObj as { code: string }).code
      : null;

  // 1. Code-first lookup — narrow to PerpsErrorCode only after membership check
  if (errorCode && errorCode in ERROR_CODE_TO_I18N_KEY) {
    const i18nKey = ERROR_CODE_TO_I18N_KEY[errorCode as PerpsErrorCode];
    return t(i18nKey);
  }

  // 2. Message-as-code lookup — handles plain strings that ARE error codes
  //    (e.g. WithdrawResult.error wrapped in `new Error(code)`)
  const message = errorObj?.message ?? '';
  if (message && message in ERROR_CODE_TO_I18N_KEY) {
    return t(ERROR_CODE_TO_I18N_KEY[message as PerpsErrorCode]);
  }

  // 3. Pattern match against raw error message
  if (message) {
    for (const { pattern, code } of API_ERROR_PATTERNS) {
      if (pattern.test(message)) {
        const i18nKey = ERROR_CODE_TO_I18N_KEY[code];
        return t(i18nKey);
      }
    }
  }

  // 4. No match
  return null;
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
export function handlePerpsError(
  error: unknown,
  t: (key: string) => string,
): string {
  return translatePerpsError(error, t) ?? t('somethingWentWrong');
}
