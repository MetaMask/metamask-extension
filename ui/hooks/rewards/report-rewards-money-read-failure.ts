import { captureException } from '../../../shared/lib/sentry';
import { readRewardsMoneyHttpFailure } from './read-rewards-money-http-failure';

/**
 * Same ceiling as the one-shot refetch. A busy pod sends 2, and the data
 * service has already retried it. A statement timeout sends 30, which that
 * retry skips, and the one-shot refetch waits it out. Anything longer is
 * reported now because nothing retries it.
 */
const BUSY_READ_RETRY_MAX_SECONDS = 30;

/** One rejection shared by several screens is still one failure. */
const reportedErrors = new WeakSet<object>();

/**
 * The controller throws this when the flag is off. A hook that still calls
 * must not report it.
 */
const REWARDS_MONEY_DISABLED_MESSAGE = 'Rewards Money is disabled';

function errorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return undefined;
  }
  const { message } = error as { message?: unknown };
  return typeof message === 'string' ? message : undefined;
}

function isRewardsMoneyDisabled(error: unknown): boolean {
  return errorMessage(error) === REWARDS_MONEY_DISABLED_MESSAGE;
}

/**
 * A `429` or `503` whose `Retry-After` is at most 30 seconds. The UI still
 * has one refetch ahead of it.
 *
 * @param error - The thrown error, including the serialized RPC bag.
 * @returns Whether the first failure should stay quiet.
 */
export function isShortBusyRewardsMoneyRead(error: unknown): boolean {
  const failure = readRewardsMoneyHttpFailure(error);
  if (failure.status !== 429 && failure.status !== 503) {
    return false;
  }
  const seconds = failure.retryAfterSeconds;
  return seconds !== undefined && seconds <= BUSY_READ_RETRY_MAX_SECONDS;
}

/**
 * Report a read that the screen will not recover by itself. `feature` is the
 * caller's Sentry tag.
 *
 * A `429` or `503` whose `Retry-After` is at most 30 seconds still has one
 * refetch ahead of it, so the first failure stays quiet. The refetch's
 * failure is the one that stuck. A disabled controller is not a failure of
 * the read, so it stays quiet too. Any other failure is reported now. A
 * second screen waiting on the same rejected promise does not report it
 * again.
 *
 * @param error - The thrown error.
 * @param context - Sentry context tag, such as `referralMe.fetch_failed`.
 * @param followUp - True when this is the one-shot refetch, not the first read.
 * @param feature - Sentry feature tag.
 */
export function reportRewardsMoneyReadFailure(
  error: unknown,
  context: string,
  followUp: boolean,
  feature: string,
): void {
  if (isRewardsMoneyDisabled(error)) {
    return;
  }
  if (!followUp && isShortBusyRewardsMoneyRead(error)) {
    return;
  }
  if (typeof error === 'object' && error !== null) {
    if (reportedErrors.has(error)) {
      return;
    }
    reportedErrors.add(error);
  }
  captureException(error instanceof Error ? error : new Error(String(error)), {
    tags: { feature, context },
  });
}
