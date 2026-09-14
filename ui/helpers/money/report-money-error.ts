import type { InterestWindow } from '@metamask/money-account-api-data-service';
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
};

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
 */
export function reportMoneyError(
  message: string,
  error: unknown,
  extra?: MoneyErrorExtra,
): void {
  captureException(createSentryError(message, error), {
    tags: { feature: 'money' },
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
 */
export function reportMoneyQueryErrorOnce(
  key: string,
  message: string,
  error: unknown,
  extra?: MoneyErrorExtra,
): void {
  const fingerprint = fingerprintUnknownError(error);
  if (reportedQueryFailures.get(key) === fingerprint) {
    return;
  }
  reportedQueryFailures.set(key, fingerprint);
  reportMoneyError(message, error, extra);
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
