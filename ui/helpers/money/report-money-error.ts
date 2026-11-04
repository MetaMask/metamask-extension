import type { InterestWindow } from '@metamask/money-account-api-data-service';
import { hasProperty, isObject } from '@metamask/utils';
import { createSentryError } from '../../../shared/lib/error';
import { captureException } from '../../../shared/lib/sentry';
import type { MoneyAccountDepositIntent } from './deposit-intent';

/**
 * Structured, PII-free context attached to Money Account Sentry events.
 *
 * Never include addresses, balances, or amounts.
 */
export type MoneyErrorExtra = {
  flow?: 'deposit' | 'withdraw';
  intent?: MoneyAccountDepositIntent;
  attempts?: number;
  errorCode?: string;
  query?: string;
  window?: InterestWindow;
} & MoneyApiErrorDetails;

/**
 * Diagnostics carried by Money Account API errors. The data service redacts
 * addresses from `responseBody` and allowlists `responseHeaders`.
 */
export type MoneyApiErrorDetails = {
  errorName?: string;
  httpStatus?: number;
  responseBody?: string | null;
  responseHeaders?: Record<string, string>;
};

/**
 * Extracts Money Account API diagnostics from a query error. Errors thrown in
 * the background reach the UI as a `JsonRpcError` whose `data.cause` holds the
 * original error's own properties, so those are read when present.
 *
 * @param error - The query error.
 * @returns The diagnostics that are present on the error.
 */
export function getMoneyApiErrorDetails(error: unknown): MoneyApiErrorDetails {
  const source =
    isObject(error) &&
    hasProperty(error, 'data') &&
    isObject(error.data) &&
    hasProperty(error.data, 'cause') &&
    isObject(error.data.cause)
      ? error.data.cause
      : error;
  if (!isObject(source)) {
    return {};
  }

  const { name, httpStatus, responseBody, responseHeaders } = source;
  return {
    ...(typeof name === 'string' ? { errorName: name } : {}),
    ...(typeof httpStatus === 'number' ? { httpStatus } : {}),
    ...(typeof responseBody === 'string' || responseBody === null
      ? { responseBody }
      : {}),
    ...(isObject(responseHeaders)
      ? { responseHeaders: responseHeaders as Record<string, string> }
      : {}),
  };
}

const reportedQueryFailures = new Map<string, string>();

const fingerprintUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Forwards a Money Account failure to Sentry with a stable `feature: money`
 * tag. `captureException` already logs locally, so callers should not also
 * `console.error`.
 *
 * @param message - Human-readable context describing where the failure happened.
 * @param error - The thrown value, attached as `.cause` on the Sentry error.
 * @param extra - Optional PII-free diagnostic fields.
 * @param tags - Optional Sentry tags, which may override the `feature` tag.
 */
export function reportMoneyError(
  message: string,
  error: unknown,
  extra?: MoneyErrorExtra,
  tags?: Record<string, string>,
): void {
  captureException(createSentryError(message, error), {
    tags: { feature: 'money', ...tags },
    ...(extra ? { extra } : {}),
  });
}

/**
 * Reports a recurring query failure at most once per key + error fingerprint.
 *
 * Money data hooks are mounted in several trees at once and some queries poll
 * while in `error`, so a naive `useEffect` would spam Sentry. Recovery
 * (`clearReportedMoneyQueryError`) lets a later distinct failure report again.
 *
 * @param key - Stable query identity (`fetchBalanceWithFallback`, `30d`, …).
 * @param message - Human-readable context describing where the failure happened.
 * @param error - The thrown value, attached as `.cause` on the Sentry error.
 * @param extra - Optional PII-free diagnostic fields.
 * @param tags - Optional Sentry tags, which may override the `feature` tag.
 */
export function reportMoneyQueryErrorOnce(
  key: string,
  message: string,
  error: unknown,
  extra?: MoneyErrorExtra,
  tags?: Record<string, string>,
): void {
  const fingerprint = fingerprintUnknownError(error);
  if (reportedQueryFailures.get(key) === fingerprint) {
    return;
  }
  reportedQueryFailures.set(key, fingerprint);
  reportMoneyError(message, error, extra, tags);
}

/**
 * Clears the dedupe entry so a later failure of the same query reports again.
 *
 * @param key - The query identity previously passed to
 * {@link reportMoneyQueryErrorOnce}.
 */
export function clearReportedMoneyQueryError(key: string): void {
  reportedQueryFailures.delete(key);
}

/**
 * Test-only: resets query-error dedupe between cases.
 */
export function resetReportedMoneyQueryErrorsForTests(): void {
  reportedQueryFailures.clear();
}
