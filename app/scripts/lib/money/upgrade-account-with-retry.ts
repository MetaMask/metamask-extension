import {
  isMoneyAccountUpgradeStepError,
  isTerminalMoneyAccountUpgradeError,
} from '@metamask/money-account-upgrade-controller';
import type { Hex } from '@metamask/utils';

/**
 * Delays between retry attempts. Once the schedule is exhausted the last
 * delay repeats.
 */
const RETRY_DELAYS_MS = [10_000, 20_000, 40_000, 60_000];

/**
 * The most attempts one run makes (roughly eight minutes of retrying).
 *
 * Mobile retries without a limit because its run is aborted when the user
 * leaves the Money surface; here the run lives in the background with nothing
 * to abort it, so it is capped instead. The upgrade service re-arms a
 * capped-out address on the next UI trigger.
 */
export const MAX_UPGRADE_ATTEMPTS = 10;

/**
 * Runs the Money Account upgrade sequence, retrying failed attempts with
 * capped exponential backoff (10s, 20s, 40s, then every 60s) up to
 * {@link MAX_UPGRADE_ATTEMPTS} attempts.
 *
 * `upgradeAccount` is idempotent and resumable, so a retry only re-runs the
 * steps that have not yet succeeded. Rethrows the error without further
 * attempts when the failure is terminal (see
 * `isTerminalMoneyAccountUpgradeError`), when it is not a step failure at all
 * (e.g. the controller was not initialized), or when the attempt cap is
 * reached.
 *
 * @param upgradeAccount - Runs a single upgrade attempt.
 * @param address - The Money Account address to upgrade.
 * @param options - Retry options.
 * @param options.onRetry - Called with each failure that will be retried and
 * the (1-indexed) attempt that produced it. Failures that end the run are
 * rethrown instead, so between `onRetry` and the returned promise every
 * failure surfaces exactly once. Must not throw.
 */
export async function upgradeAccountWithRetry(
  upgradeAccount: (address: Hex) => Promise<void>,
  address: Hex,
  {
    onRetry,
  }: {
    onRetry?: (error: unknown, attempt: number) => void;
  } = {},
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await upgradeAccount(address);
      return;
    } catch (error) {
      const retryable =
        attempt < MAX_UPGRADE_ATTEMPTS &&
        isMoneyAccountUpgradeStepError(error) &&
        !isTerminalMoneyAccountUpgradeError(error);
      if (!retryable) {
        throw error;
      }
      onRetry?.(error, attempt);
      await wait(retryDelayMs(attempt));
    }
  }
}

/**
 * The backoff delay to wait after the given (1-indexed) failed attempt. Once
 * the schedule is exhausted, the last delay repeats.
 *
 * @param attempt - The attempt that just failed.
 * @returns The delay in milliseconds.
 */
function retryDelayMs(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length) - 1];
}

/**
 * Waits for the given duration.
 *
 * @param durationMs - How long to wait.
 * @returns A promise that resolves after the wait.
 */
async function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
